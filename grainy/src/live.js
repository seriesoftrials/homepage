import { setupComposer } from "./live-composer.js";
import { setupTyping } from "./live-typing.js";

const byId = (id) => document.getElementById(id);
const [, , code, mode] = location.pathname.replace(/\/$/, "").split("/");
const view = code === "manage" ? "setup" : mode || "join";
const endpoint = `/api/live/${code}`;
const roomCode = /^[a-f0-9]{10}$/;
const clock = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" });
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
let state;
let sending = false;
let managing = false;
let submission;
let syncing = false;
let requestedVersion = 0;

document.body.dataset.view = view;
if (view === "join") {
  byId("section-name").replaceWith(eventTitle.parentElement);
  intro.hidden = true;
  byId("live-footer").hidden = false;
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

async function api(path, method = "GET", data) {
  const response = await fetch(path, {
    method,
    cache: "no-store",
    ...(data && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
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

function showError(error) {
  closeComposer(false);
  intro.hidden = false;
  eventImage.hidden = true;
  eventTitle.textContent = error.status === 404 ? "행사를 찾을 수 없어요" : "화면을 열 수 없어요";
  byId("page-message").textContent = error.status === 401 ? "SERIAL 관리자 계정으로 로그인한 뒤 이 화면을 새로고침해 주세요." : error.message;
  byId("page-message").hidden = false;
  byId("login").hidden = error.status !== 401;
  byId("workspace").hidden = true;
  byId("create").hidden = true;
  byId("connection").hidden = true;
  byId("fullscreen").hidden = true;
}

function connection(status, label) {
  const indicator = byId("connection");
  indicator.dataset.state = status;
  indicator.textContent = label;
  indicator.hidden = false;
}

function postAction(id, action) {
  return postList.querySelector(`[data-id="${id}"] [data-post-action="${action}"]`);
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
  const target = speakers.length ? `${speaker?.name ?? "전체"} · ` : "";
  const time = clock.format(post.createdAt);
  meta.textContent = view === "join"
    ? `${speaker?.name ?? "전체"}에게 · ${time}`
    : `${post.hidden ? "숨김 · " : ""}${target}익명 · ${time}`;
  const copy = document.createElement("p");
  copy.className = "post-text";
  copy.textContent = post.text;
  content.append(meta, copy);
  item.append(content);
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
  const incoming = Boolean(view === "join" && state && newest &&
    newest.createdAt >= (state.posts[0]?.createdAt ?? 0) &&
    !state.posts.some(({ id }) => id === newest.id));
  state = next;
  const { room, posts, total } = state;
  document.title = `${room.title} | Serial Live`;
  eventTitle.textContent = room.title;
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
    if (typing) url.searchParams.set("typing", "1");
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
      if (!next.room?.open) typing?.reset();
      if (view === "manage") syncManager(next.room.version).catch(handleError);
      else render(next);
      connection("online", view === "join" ? "Live" : "실시간 연결");
    });
    socket.addEventListener("close", () => {
      typing?.reset();
      clearInterval(heartbeat);
      if (stopped) return;
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
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    submission = { id: Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""), message, speaker };
  }
  sending = button.disabled = questionTargets.disabled = true;
  success.textContent = "";
  feedback(status, "보내는 중…");
  try {
    await api(`${endpoint}/posts`, "POST", { id: submission.id, text: message, speaker });
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

async function loadRooms() {
  const status = byId("event-directory-status");
  const retry = byId("retry-event-directory");
  const list = byId("event-directory-list");
  retry.hidden = true;
  feedback(status, "행사를 불러오는 중…");
  try {
    const rooms = [];
    let after;
    do {
      const page = await api(`/api/live/rooms${after ? `?after=${after}` : ""}`);
      rooms.push(...page.rooms);
      after = page.next;
    } while (after);
    rooms.sort((a, b) => a.title.localeCompare(b.title, "ko") || a.code.localeCompare(b.code));
    const items = rooms.map((room) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `/live/${room.code}/manage`;
      const title = document.createElement("strong");
      title.textContent = room.title;
      const meta = document.createElement("span");
      meta.textContent = `${room.open ? "접수 중" : "접수 마감"} · ${room.code}`;
      link.append(title, meta);
      item.append(link);
      return item;
    });
    list.replaceChildren(...items);
    feedback(status, items.length ? "" : "아직 만든 행사가 없어요.");
  } catch (error) {
    if ([401, 403].includes(error.status)) return showError(error);
    feedback(status, error.message, true);
    retry.hidden = false;
  }
}

byId("retry-event-directory").addEventListener("click", loadRooms);
window.addEventListener("pageshow", (event) => {
  if (view === "setup" && event.persisted && !byId("create").hidden) loadRooms();
});

async function start() {
  if (view === "setup") {
    byId("section-name").textContent = "Serial Live 운영";
    const { member } = await api("/api/me");
    if (member?.role !== "admin") throw new Error("SERIAL 관리자만 사용할 수 있습니다.");
    eventTitle.textContent = "행사 운영";
    byId("create").hidden = false;
    await loadRooms();
    return;
  }
  if (!roomCode.test(code)) throw Object.assign(new Error("참가 링크를 확인해 주세요."), { status: 404 });
  if (view !== "join") byId("section-name").textContent = view === "manage" ? "Serial Live 운영" : "Serial Live 발표";
  connection("connecting", "연결 중");
  await refresh();
  liveUpdates();
}

start().catch(showError);
