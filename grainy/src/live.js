import { setupComposer } from "./live-composer.js";
import { setupTyping } from "./live-typing.js";

const byId = (id) => document.getElementById(id);
const [, , code, mode] = location.pathname.replace(/\/$/, "").split("/");
const view = code === "manage" ? "setup" : mode || "join";
const publicView = view === "join" || view === "screen";
const endpoint = `/api/live/${code}`;
const reactionEndpoint = `${endpoint}/reactions`;
const roomCode = /^[a-f0-9]{10}$/;
const clock = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" });
const minute = 60_000;
const compose = byId("compose");
const composeSlot = byId("compose-slot");
const text = byId("post-text");
const questionTargets = byId("question-targets");
const speakerOptions = byId("speaker-options");
const eventTitle = byId("title");
const intro = eventTitle.closest(".intro");
const eventImage = byId("event-image");
const eventImageFile = byId("event-image-file");
const chooseEventImage = byId("choose-event-image");
const postList = byId("posts");
const newQuestions = byId("new-questions");
const pendingLikes = new Set();
const reactionUpdates = new Map();
let likedPosts = new Set();
let voterHeaders;
let state;
let sending = false;
let managing = false;
let submission;
let syncing = false;
let requestedVersion = 0;
let postTimeTimer;

document.body.dataset.view = view;
if (publicView) document.addEventListener("visibilitychange", updatePostTimes);
if (view === "setup" || view === "manage") byId("section-name").hidden = false;
if (view === "join") {
  byId("section-name").replaceWith(eventTitle.parentElement);
  intro.hidden = true;
  byId("typing-row").hidden = false;
  postList.addEventListener("scroll", () => {
    if (postList.scrollTop <= 4) newQuestions.hidden = true;
  }, { passive: true });
  newQuestions.addEventListener("click", () => {
    postList.focus({ preventScroll: true });
    postList.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  });
}
const closeComposer = view === "join" ? setupComposer(compose, composeSlot, text) : () => {};

async function api(path, method = "GET", data, headers) {
  const response = await fetch(path, {
    method,
    cache: "no-store",
    headers: data ? { ...headers, "Content-Type": "application/json" } : headers,
    body: data && JSON.stringify(data),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(payload.error || "잠시 후 다시 시도해 주세요."), { status: response.status });
  }
  return payload;
}

function feedback(node, message = "", error = false) {
  node.textContent = message;
  node.toggleAttribute("data-error", error);
}

function showRoomTitle(title) {
  if (view !== "join" || !/^(?:awake|어웨이크)(?:\s+2026)?$/i.test(title)) {
    eventTitle.classList.remove("live-marquee");
    eventTitle.textContent = title;
    return;
  }
  if (eventTitle.classList.contains("live-marquee")) return;
  const track = document.createElement("span");
  track.className = "live-marquee-track";
  const headline = document.createElement("span");
  headline.textContent = "Awake 2026 by Serial · Fireside Chat";
  const repeat = headline.cloneNode(true);
  repeat.setAttribute("aria-hidden", "true");
  track.append(headline, repeat, repeat.cloneNode(true));
  eventTitle.classList.add("live-marquee");
  eventTitle.replaceChildren(track);
}

function showError(error) {
  closeComposer(false);
  intro.hidden = false;
  eventImage.hidden = true;
  showRoomTitle(error.status === 404 ? "행사를 찾을 수 없어요" : "화면을 열 수 없어요");
  byId("page-message").textContent = error.status === 401 ? "SERIAL 관리자 계정으로 로그인한 뒤 이 화면을 새로고침해 주세요." : error.message;
  byId("page-message").hidden = false;
  byId("login").hidden = error.status !== 401;
  byId("workspace").hidden = true;
  byId("create").hidden = true;
  byId("connection").hidden = true;
  byId("fullscreen").hidden = true;
}

function connection(status, label) {
  if (view === "join") return;
  const indicator = byId("connection");
  indicator.dataset.state = status;
  indicator.textContent = label;
  indicator.hidden = false;
}

function postAction(id, action) {
  return postList.querySelector(`[data-id="${id}"] [data-post-action="${action}"]`);
}

function newAnonymousId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function viewerId() {
  const key = `serial-live-voter:${code}`;
  const freshId = newAnonymousId();
  try {
    const saved = localStorage.getItem(key);
    if (saved && /^[a-f0-9]{32}$/.test(saved)) return saved;
    localStorage.setItem(key, freshId);
  } catch {
    // A viewer with unavailable storage can still react for this page visit.
  }
  return freshId;
}

function setReactionCount(button, likes) {
  button.lastElementChild.textContent = likes;
  button.setAttribute("aria-label", `따봉 ${likes}개`);
}

function receiveReaction({ id, likes, version }) {
  if (version <= (state?.room.version ?? -1) || version <= (reactionUpdates.get(id)?.version ?? -1)) return;
  reactionUpdates.set(id, { likes, version });
  const button = postAction(id, "reaction");
  if (button) setReactionCount(button, likes);
}

function setReactionSelection(id, active) {
  if (active) likedPosts.add(id);
  else likedPosts.delete(id);
  postAction(id, "reaction")?.setAttribute("aria-pressed", String(active));
}

function animateReaction(icon, active) {
  if (!icon || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  icon.getAnimations().find(({ id }) => id === "reaction-tap")?.cancel();
  icon.animate([
    { scale: "1" },
    { scale: active ? "1.18" : "1.08", offset: .35 },
    { scale: "1" },
  ], { id: "reaction-tap", duration: active ? 340 : 220, easing: "cubic-bezier(.2, .65, .25, 1)" });
}

async function toggleReaction(id) {
  if (pendingLikes.has(id)) return;
  const active = !likedPosts.has(id);
  const button = postAction(id, "reaction");
  animateReaction(button?.firstElementChild, active);
  const status = byId("reaction-feedback");
  pendingLikes.add(id);
  button?.setAttribute("aria-disabled", "true");
  feedback(status);
  try {
    const result = await api(reactionEndpoint, "PUT", { id, active }, voterHeaders);
    setReactionSelection(id, result.active);
    receiveReaction(result);
  } catch (error) {
    feedback(status, error.message, true);
    if (error.status === 404) refresh().catch(() => {});
  } finally {
    pendingLikes.delete(id);
    postAction(id, "reaction")?.removeAttribute("aria-disabled");
  }
}

function makeReaction(post) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "action-button action-button--quiet action-button--compact reaction-pill";
  button.dataset.postAction = "reaction";
  button.setAttribute("aria-pressed", String(likedPosts.has(post.id)));
  if (pendingLikes.has(post.id)) button.setAttribute("aria-disabled", "true");
  const icon = document.createElement("span");
  icon.textContent = "👍";
  icon.setAttribute("aria-hidden", "true");
  button.append(icon, document.createElement("span"));
  setReactionCount(button, reactionUpdates.get(post.id)?.likes ?? post.likes ?? 0);
  button.addEventListener("click", () => toggleReaction(post.id));
  return button;
}

function showSpeakerOptions(speakers) {
  if (!speakers.length || speakerOptions.childElementCount) return;
  for (const { id, name, photo } of [{ id: "", name: "전체" }, ...speakers]) {
    const option = document.createElement("label");
    option.className = "speaker-option";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "speaker";
    radio.value = id;
    radio.defaultChecked = id === "";
    option.append(radio);
    if (photo) {
      const image = document.createElement("img");
      image.src = photo;
      image.alt = "";
      image.width = image.height = 44;
      option.append(image);
    }
    const label = document.createElement("span");
    label.textContent = name;
    option.append(label);
    speakerOptions.append(option);
  }
  questionTargets.hidden = false;
}

function updatePostTimes() {
  clearTimeout(postTimeTimer);
  const now = Date.now();
  let nextUpdate = Infinity;
  for (const time of postList.querySelectorAll(".post-meta time")) {
    const createdAt = Date.parse(time.dateTime);
    const minutes = Math.max(0, Math.floor((now - createdAt) / minute));
    const label = minutes > 5 ? clock.format(createdAt) : minutes ? `${minutes}분 전` : "방금 전";
    if (time.textContent !== label) time.textContent = label;
    if (minutes <= 5) nextUpdate = Math.min(nextUpdate, createdAt + (minutes + 1) * minute);
  }
  if (Number.isFinite(nextUpdate) && !document.hidden) {
    postTimeTimer = setTimeout(updatePostTimes, nextUpdate - now);
  }
}

function makePost(post) {
  const item = document.createElement("li");
  item.className = "post";
  item.dataset.id = post.id;
  item.toggleAttribute("data-hidden", Boolean(post.hidden));
  const content = document.createElement("div");
  const meta = document.createElement("p");
  meta.className = "post-meta";
  const speakers = state.room.speakers ?? [];
  const speaker = speakers.find(({ id }) => id === post.speaker);
  const name = speaker?.name ?? "전체";
  const time = document.createElement("time");
  time.dateTime = new Date(post.createdAt).toISOString();
  time.textContent = clock.format(post.createdAt);
  if (view === "screen") {
    const recipient = document.createElement("span");
    recipient.className = "screen-recipient";
    if (speaker?.photo) {
      const photo = document.createElement("img");
      photo.src = speaker.photo;
      photo.alt = "";
      photo.width = photo.height = 44;
      recipient.append(photo);
    }
    recipient.append(`${name}에게`);
    meta.append(recipient, time);
  } else {
    const target = speakers.length ? `${name} · ` : "";
    meta.append(view === "join"
      ? `${name}에게 · `
      : `${post.hidden ? "숨김 · " : ""}${target}익명 · `, time);
  }
  const copy = document.createElement("p");
  copy.className = "post-text";
  copy.textContent = post.text;
  content.append(meta, copy);
  item.append(content);
  if (view === "join") item.append(makeReaction(post));
  if (view === "manage") {
    const actions = document.createElement("div");
    actions.className = "post-actions";
    const visibility = document.createElement("button");
    visibility.type = "button";
    visibility.className = "action-button action-button--quiet action-button--compact";
    visibility.dataset.postAction = "visibility";
    visibility.textContent = post.hidden ? "다시 표시" : "숨기기";
    visibility.disabled = managing;
    visibility.addEventListener("click", () => updateRoom({ id: post.id, hidden: !post.hidden }, "visibility"));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "action-button action-button--quiet action-button--compact post-delete";
    remove.dataset.postAction = "delete";
    remove.textContent = "삭제";
    remove.disabled = managing;
    remove.addEventListener("click", () => {
      if (window.confirm("이 글을 영구 삭제할까요?")) updateRoom({ id: post.id, remove: true }, "delete");
    });
    actions.append(visibility, remove);
    item.append(actions);
  }
  return item;
}

function renderPosts(posts, incoming) {
  const focusedAction = document.activeElement?.dataset.postAction;
  const focusedId = document.activeElement?.closest(".post")?.dataset.id;
  const scrollTop = postList.scrollTop;
  const listTop = scrollTop > 1 ? postList.getBoundingClientRect().top : 0;
  const anchor = view === "join" && scrollTop > 4
    ? Array.from(postList.children).find((item) => item.getBoundingClientRect().bottom > listTop)
    : null;
  const anchorOffset = anchor ? anchor.getBoundingClientRect().top - listTop : 0;

  postList.replaceChildren(...(view === "screen" ? posts.slice(0, 5) : posts).map(makePost));
  if (publicView) updatePostTimes();
  if (view === "screen" && incoming) postList.firstElementChild.classList.add("post-arriving");
  if (view === "join") {
    postList.tabIndex = posts.length ? 0 : -1;
    if (anchor) {
      const current = postList.querySelector(`[data-id="${anchor.dataset.id}"]`);
      const currentOffset = current && current.getBoundingClientRect().top - postList.getBoundingClientRect().top;
      postList.scrollTop = current ? postList.scrollTop + currentOffset - anchorOffset : scrollTop;
    }
    if (incoming && scrollTop > 4 && postList.scrollTop > 4) newQuestions.hidden = false;
    if (incoming && scrollTop <= 4) {
      postList.scrollTop = 0;
      postList.firstElementChild.classList.add("post-arriving");
    }
    if (postList.scrollTop <= 4) newQuestions.hidden = true;
  }
  if (focusedId && focusedAction) postAction(focusedId, focusedAction)?.focus({ preventScroll: true });
}

function render(next) {
  if (!next.room || next.room.version <= (state?.room.version ?? -1)) return;
  const newest = next.posts[0];
  const incoming = Boolean(publicView && state && newest &&
    newest.createdAt >= (state.posts[0]?.createdAt ?? 0) &&
    !state.posts.some(({ id }) => id === newest.id));
  state = next;
  const { room, posts, total } = state;
  for (const [id, update] of reactionUpdates) {
    if (update.version <= room.version) reactionUpdates.delete(id);
  }
  document.title = `${room.title} | Live`;
  showRoomTitle(room.title);
  intro.hidden = view === "join";
  eventImage.hidden = !room.imageUrl;
  if (room.imageUrl && eventImage.getAttribute("src") !== room.imageUrl) eventImage.src = room.imageUrl;
  byId("page-message").hidden = true;
  byId("login").hidden = true;
  byId("workspace").hidden = false;
  byId("feed-title").textContent = view === "manage" ? "들어온 글" : "올라온 글";
  byId("post-count").textContent = `${total}개`;
  byId("empty-feed").hidden = Boolean(posts.length);
  renderPosts(posts, incoming);

  if (view === "manage") {
    byId("controls").hidden = false;
    byId("join-link").value = `${location.origin}/live/${room.code}`;
    byId("screen-link").href = `/live/${room.code}/screen`;
    chooseEventImage.textContent = room.imageUrl ? "행사 이미지 변경" : "행사 이미지 올리기";
    byId("room-status").textContent = room.open ? "글을 받고 있어요" : "글 접수가 마감되었어요";
    byId("toggle-room").textContent = room.open ? "접수 마감" : "접수 다시 열기";
  }
  if (view === "join") {
    showSpeakerOptions(room.speakers ?? []);
    composeSlot.hidden = !room.open;
    if (!room.open) closeComposer(false);
    byId("closed").hidden = Boolean(room.open);
  }
  if (view === "screen" && document.documentElement.requestFullscreen) byId("fullscreen").hidden = false;
}

const refresh = () => api(view === "manage" ? `${endpoint}/manage` : endpoint).then(render);

async function syncManager(version) {
  requestedVersion = Math.max(requestedVersion, version);
  if (syncing || (state?.room.version ?? -1) >= requestedVersion) return;
  syncing = true;
  try {
    while ((state?.room.version ?? -1) < requestedVersion) await refresh();
  } finally {
    syncing = false;
  }
}

function liveUpdates() {
  let socket;
  let reconnect;
  let heartbeat;
  let fallback;
  let failures = 0;
  let stopped = false;
  const typing = view === "join" ? setupTyping((message) => {
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(message);
    return true;
  }) : null;

  if (typing) {
    text.addEventListener("input", () => typing.input(Boolean(text.value.trim() && state?.room.open && !sending)));
    text.addEventListener("blur", typing.stop);
    compose.addEventListener("submit", typing.stop);
  }

  function stop() {
    stopped = true;
    typing?.reset();
    clearTimeout(reconnect);
    clearInterval(heartbeat);
    clearInterval(fallback);
    fallback = undefined;
    socket?.close();
  }

  function handleError(error) {
    if ([401, 403, 404].includes(error.status)) {
      stop();
      showError(error);
    } else {
      connection("connecting", "다시 연결 중");
      socket?.close();
    }
  }

  function connect() {
    if (stopped) return;
    const url = new URL(`${endpoint}/stream`, location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    if (typing) {
      url.searchParams.set("typing", "1");
      url.searchParams.set("reactions", "1");
    }
    socket = new WebSocket(url);
    let lastReceived = Date.now();
    socket.addEventListener("open", () => {
      failures = 0;
      clearInterval(fallback);
      fallback = undefined;
      lastReceived = Date.now();
      heartbeat = setInterval(() => {
        if (Date.now() - lastReceived > 55_000) socket.close();
        else if (socket.readyState === WebSocket.OPEN) socket.send("ping");
      }, 20_000);
    });
    socket.addEventListener("message", ({ data }) => {
      lastReceived = Date.now();
      if (data === "pong") return;
      const next = JSON.parse(data);
      if (next.type === "typing") {
        if (state?.room.open) typing?.receive(next);
        return;
      }
      if (next.type === "reaction") {
        receiveReaction(next);
        return;
      }
      if (!next.room?.open) typing?.reset();
      if (view === "manage") syncManager(next.room.version).catch(handleError);
      else render(next);
      connection("online", "실시간 연결");
    });
    socket.addEventListener("close", ({ code }) => {
      typing?.reset();
      clearInterval(heartbeat);
      if (stopped) return;
      if (code === 4004) {
        return handleError(Object.assign(new Error("삭제된 행사입니다."), { status: 404 }));
      }
      connection("connecting", "다시 연결 중");
      if (!fallback || failures === 0) {
        clearInterval(fallback);
        fallback = setInterval(() => refresh().then(() => connection("connecting", "5초마다 업데이트")).catch(handleError), 5000);
      }
      reconnect = setTimeout(connect, Math.min(1000 * 2 ** failures++, 15_000));
    });
  }

  window.addEventListener("pagehide", stop);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      stopped = false;
      connect();
    }
  });
  connect();
}

const charCount = () => { byId("char-count").textContent = `${text.value.length} / 280`; };
text.addEventListener("input", charCount);
compose.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = compose.querySelector('button[type="submit"]');
  const status = compose.querySelector(".feedback");
  const success = byId("compose-success");
  const message = text.value.trim();
  const speaker = compose.elements.speaker?.value ?? "";
  if (sending) return;
  if (!message) return feedback(status, "남길 글을 입력해 주세요.", true);
  if (submission?.message !== message || submission.speaker !== speaker) {
    submission = { id: newAnonymousId(), message, speaker };
  }
  sending = button.disabled = questionTargets.disabled = true;
  success.textContent = "";
  feedback(status, "보내는 중…");
  try {
    const receipt = await api(`${endpoint}/posts`, "POST", { id: submission.id, text: message, speaker }, voterHeaders);
    if (receipt.liked) setReactionSelection(receipt.id, true);
    if (text.value.trim() === message) text.value = "";
    submission = null;
    charCount();
    feedback(status);
    success.textContent = "글을 보냈어요.";
    if (!text.value) closeComposer();
    refresh().catch(() => {});
  } catch (error) {
    feedback(status, error.message, true);
  } finally {
    sending = button.disabled = questionTargets.disabled = false;
  }
});

async function squareEventImage(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d", { alpha: false });
    const size = Math.min(bitmap.width, bitmap.height);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, canvas.width, canvas.height);
    const image = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!image) throw new Error("이미지 변환에 실패했습니다.");
    return image;
  } finally {
    bitmap.close();
  }
}

chooseEventImage.addEventListener("click", () => eventImageFile.click());
eventImageFile.addEventListener("change", async () => {
  const file = eventImageFile.files[0];
  eventImageFile.value = "";
  if (!file) return;
  const status = byId("manage-feedback");
  chooseEventImage.disabled = true;
  feedback(status, "이미지 올리는 중…");
  try {
    const image = await squareEventImage(file).catch(() => {
      throw new Error("이미지를 열 수 없어요. JPG, PNG 또는 WebP 파일을 선택해 주세요.");
    });
    const response = await fetch(`${endpoint}/image`, { method: "PUT", body: image, headers: { "Content-Type": image.type } });
    const next = await response.json();
    if (!response.ok) throw new Error(next.error || "이미지를 올리지 못했어요.");
    render(next);
    feedback(status, "행사 이미지를 변경했어요.");
  } catch (error) {
    feedback(status, error.message, true);
  } finally {
    chooseEventImage.disabled = false;
  }
});

async function updateRoom(changes, action) {
  if (managing) return;
  const status = byId("manage-feedback");
  const toggle = byId("toggle-room");
  let focusId = changes.id;
  let focusAction = action;
  const removedRow = changes.remove ? postAction(focusId, focusAction)?.closest(".post") : null;
  const adjacentPost = removedRow?.nextElementSibling ?? removedRow?.previousElementSibling;
  function setBusy(busy) {
    managing = toggle.disabled = busy;
    for (const button of postList.querySelectorAll("button")) button.disabled = busy;
  }
  setBusy(true);
  feedback(status, "변경 중…");
  try {
    const next = await api(`${endpoint}/manage`, "PATCH", changes);
    if (changes.remove) {
      focusId = adjacentPost?.dataset.id;
      focusAction = "visibility";
    }
    render(next);
    const message = changes.remove ? "글을 삭제했어요."
      : changes.id ? (changes.hidden ? "글을 숨겼어요." : "글을 다시 표시했어요.")
      : byId("room-status").textContent;
    feedback(status, message);
  } catch (error) {
    if ([401, 403].includes(error.status)) showError(error);
    feedback(status, error.message, true);
  } finally {
    setBusy(false);
    const target = focusId ? postAction(focusId, focusAction) : null;
    (target ?? toggle).focus({ preventScroll: true });
  }
}

byId("toggle-room").addEventListener("click", () => updateRoom({ open: !state.room.open }));
byId("copy-link").addEventListener("click", async () => {
  const link = byId("join-link");
  try {
    await navigator.clipboard.writeText(link.value);
    feedback(byId("manage-feedback"), "참가 링크를 복사했어요.");
  } catch {
    link.focus();
    link.select();
    feedback(byId("manage-feedback"), "선택한 참가 링크를 복사해 주세요.");
  }
});

const fullscreen = byId("fullscreen");
fullscreen.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    fullscreen.textContent = "전체 화면을 열 수 없어요";
  }
});
document.addEventListener("fullscreenchange", () => {
  fullscreen.textContent = document.fullscreenElement ? "전체 화면 종료" : "전체 화면";
});

byId("create-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".feedback");
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    const { room } = await api("/api/live/rooms", "POST", { title: form.elements.title.value });
    location.assign(new URL(`/live/${room.code}/manage`, location.origin));
  } catch (error) {
    if ([401, 403].includes(error.status)) showError(error);
    feedback(status, error.message, true);
    button.disabled = false;
  }
});

byId("open-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form.elements.code.value.trim().toLowerCase();
  const code = input.match(/\/live\/([a-f0-9]{10})(?:[/?#]|$)/)?.[1] ?? input;
  const status = form.querySelector(".feedback");
  if (!roomCode.test(code)) return feedback(status, "행사 링크나 10자리 코드를 확인해 주세요.", true);
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    await api("/api/live/rooms/remember", "POST", { code });
    location.assign(new URL(`/live/${code}/manage`, location.origin));
  } catch (error) {
    if ([401, 403].includes(error.status)) showError(error);
    feedback(status, error.message, true);
    button.disabled = false;
  }
});

function setupDirectory() {
  const status = byId("event-directory-status");
  const retry = byId("retry-event-directory");
  const list = byId("event-directory-list");
  const dialog = byId("event-action-dialog");
  const form = byId("event-action-form");
  const name = byId("event-action-name");
  const description = byId("event-action-description");
  const cancel = byId("cancel-event-action");
  const submit = byId("submit-event-action");
  const actionStatus = form.querySelector(".feedback");
  let rooms = [];
  let action;

  function openAction(room, remove, trigger) {
    action = { room, remove };
    trigger.parentElement.open = false;
    trigger.focus();
    byId("event-action-title").textContent = remove ? "행사 삭제" : "이름 변경";
    byId("event-action-name-field").hidden = remove;
    name.required = !remove;
    name.value = remove ? "" : room.title;
    description.hidden = !remove;
    description.textContent = remove ? `‘${room.title}’ 행사를 삭제할까요? 참가 및 발표 링크가 닫혀요.` : "";
    submit.textContent = remove ? "삭제" : "저장";
    submit.toggleAttribute("data-delete", remove);
    feedback(actionStatus);
    dialog.showModal();
    if (remove) cancel.focus();
    else name.select();
  }

  function roomItem(room) {
    const item = document.createElement("li");
    item.dataset.room = room.code;
    const link = document.createElement("a");
    link.href = `/live/${room.code}/manage`;
    const title = document.createElement("strong");
    title.textContent = room.title;
    const meta = document.createElement("span");
    meta.textContent = `${room.open ? "접수 중" : "접수 마감"} · ${room.code}`;
    link.append(title, meta);

    const options = document.createElement("details");
    options.className = "event-options";
    options.name = "live-event-options";
    const trigger = document.createElement("summary");
    trigger.textContent = "⋯";
    trigger.setAttribute("aria-label", `${room.title} 관리 메뉴`);
    const menu = document.createElement("div");
    menu.className = "event-options-menu";
    for (const [label, remove] of [["이름 변경", false], ["삭제", true]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      if (remove) button.className = "event-delete";
      button.addEventListener("click", () => openAction(room, remove, trigger));
      menu.append(button);
    }
    options.append(trigger, menu);
    item.append(link, options);
    return item;
  }

  function renderRooms() {
    rooms.sort((a, b) => a.title.localeCompare(b.title, "ko") || a.code.localeCompare(b.code));
    list.replaceChildren(...rooms.map(roomItem));
    feedback(status, rooms.length ? "" : "아직 만든 행사가 없어요.");
  }

  async function load() {
    retry.hidden = true;
    feedback(status, "행사를 불러오는 중…");
    try {
      const loaded = [];
      let after;
      do {
        const page = await api(`/api/live/rooms${after ? `?after=${after}` : ""}`);
        loaded.push(...page.rooms);
        after = page.next;
      } while (after);
      rooms = loaded;
      renderRooms();
    } catch (error) {
      if ([401, 403].includes(error.status)) return showError(error);
      feedback(status, error.message, true);
      retry.hidden = false;
    }
  }

  document.addEventListener("click", (event) => {
    for (const menu of list.querySelectorAll(".event-options[open]")) {
      if (!menu.contains(event.target)) menu.open = false;
    }
  });
  list.addEventListener("keydown", (event) => {
    const menu = event.target.closest(".event-options[open]");
    if (event.key !== "Escape" || !menu) return;
    menu.open = false;
    menu.querySelector("summary").focus();
  });
  cancel.addEventListener("click", () => dialog.close());
  dialog.addEventListener("cancel", (event) => {
    if (submit.disabled) event.preventDefault();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const { room, remove } = action;
    const path = `/api/live/${room.code}/manage`;
    feedback(actionStatus);
    submit.disabled = cancel.disabled = true;
    name.readOnly = true;
    try {
      if (remove) {
        await api(path, "DELETE");
        rooms = rooms.filter(({ code }) => code !== room.code);
      } else {
        const { room: updated } = await api(path, "PATCH", { title: name.value });
        rooms = rooms.map((item) => item.code === room.code ? updated : item);
      }
      dialog.close();
      renderRooms();
      const next = list.querySelector(`[data-room="${room.code}"] summary`) ?? byId("event-directory-title");
      next.focus({ preventScroll: true });
    } catch (error) {
      feedback(actionStatus, error.message, true);
    } finally {
      submit.disabled = cancel.disabled = false;
      name.readOnly = false;
    }
  });
  retry.addEventListener("click", load);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && !byId("create").hidden) load();
  });
  return load();
}

async function start() {
  if (view === "setup") {
    const { member } = await api("/api/me");
    if (member?.role !== "admin") throw new Error("SERIAL 관리자만 사용할 수 있습니다.");
    eventTitle.textContent = "행사 운영";
    byId("create").hidden = false;
    await setupDirectory();
    return;
  }
  if (!roomCode.test(code)) throw Object.assign(new Error("참가 링크를 확인해 주세요."), { status: 404 });
  connection("connecting", "연결 중");
  if (view === "join") {
    voterHeaders = { "X-Live-Voter": viewerId() };
    const [snapshot, votes] = await Promise.all([
      api(endpoint),
      api(reactionEndpoint, "GET", undefined, voterHeaders).catch(() => ({ liked: [] })),
    ]);
    likedPosts = new Set(votes.liked);
    render(snapshot);
  } else {
    await refresh();
  }
  liveUpdates();
}

start().catch(showError);
