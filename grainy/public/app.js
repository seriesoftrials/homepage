(() => {
const initializedForms = new WeakSet();
const english = () => document.documentElement?.lang === "en";

function initContactForm() {
  const dialog = document.querySelector("[data-contact-dialog]");
  const openButton = document.querySelector("[data-contact-open]");
  const closeButton = document.querySelector("[data-contact-close]");
  const form = document.querySelector("[data-contact-form]");
  const submitButton = document.querySelector("[data-contact-submit]");
  const status = document.querySelector("[data-form-status]");
  const phoneInput = document.querySelector("[data-phone-input]");
  if (!form || initializedForms.has(form)) return;
  initializedForms.add(form);
  const mobilePrefixLength = 3;
  const mobileNumberLength = 8;

  function formatPhoneNumber(value) {
    const digits = value.replace(/\D/g, "").slice(0, mobilePrefixLength + mobileNumberLength);

    if (digits.length <= mobilePrefixLength) return digits;
    if (digits.length <= mobilePrefixLength + 4) return `${digits.slice(0, mobilePrefixLength)}-${digits.slice(mobilePrefixLength)}`;

    return `${digits.slice(0, mobilePrefixLength)}-${digits.slice(mobilePrefixLength, mobilePrefixLength + 4)}-${digits.slice(mobilePrefixLength + 4)}`;
  }

  function setStatus(message = "", state = "") {
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  }

  function openDialog() {
    setStatus();
    dialog.showModal();
  }

  function closeDialog() {
    dialog.close();
  }

  openButton.addEventListener("click", openDialog);
  closeButton.addEventListener("click", closeDialog);

  phoneInput.addEventListener("input", () => {
    phoneInput.value = formatPhoneNumber(phoneInput.value);
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const originalLabel = submitButton.innerHTML;

    submitButton.disabled = true;
    submitButton.textContent = english() ? "Sending…" : "남기는 중…";
    setStatus();

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          memo: formData.get("memo"),
          website: formData.get("website"),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(english() ? "We could not save your details. Please try again." : result.error || "정보를 남기지 못했습니다.");

      form.reset();
      setStatus(english() ? "Thank you. We will get back to you personally." : "남겨주셔서 감사합니다. 확인한 뒤 연락드리겠습니다.", "success");
    } catch (error) {
      setStatus(english() ? "We could not save your details. Please try again." : error.message || "잠시 후 다시 시도해주세요.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalLabel;
    }
  });
}

function initMembersHeading() {
  const heading = document.querySelector("[data-founding-members]");
  if (!heading) return;
  let language = "ko";
  try { if (localStorage.getItem("serial-language") === "en") language = "en"; } catch {}
  heading.lang = language;
  heading.textContent = language === "en" ? "Founding Members" : "창립 멤버";
}

function initializePage() {
  initContactForm();
  initMembersHeading();
}

initializePage();
document.addEventListener("serial:pagechange", initializePage);
})();
