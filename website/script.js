if (window.lucide) {
  window.lucide.createIcons({attrs: {"stroke-width": 1.7, "aria-hidden": "true"}});
}

const menuToggle = document.querySelector(".menu-toggle");
const drawer = document.querySelector(".mobile-drawer");
const drawerClose = document.querySelector(".drawer-close");

function setDrawer(open) {
  if (!drawer || !menuToggle) return;
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  menuToggle.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("drawer-open", open);
}

menuToggle?.addEventListener("click", () => setDrawer(true));
drawerClose?.addEventListener("click", () => setDrawer(false));
drawer?.addEventListener("click", (event) => {
  if (event.target === drawer) setDrawer(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setDrawer(false);
});

const downloadUrl = "https://github.com/LalaWu001/LLMtrans/releases/latest/download/release_WINx64.zip";
const downloadInviteCode = "962638";
const downloadDialog = document.createElement("dialog");
downloadDialog.className = "download-gate";
downloadDialog.setAttribute("aria-labelledby", "download-gate-title");
downloadDialog.innerHTML = `
  <form class="download-gate-panel" method="dialog" novalidate>
    <div class="download-gate-heading">
      <p>CLIENT ACCESS</p>
      <button class="download-gate-close" type="button" aria-label="关闭下载验证">关闭</button>
    </div>
    <div class="download-gate-copy">
      <span>01 / INVITATION</span>
      <h2 id="download-gate-title">输入邀请码<br />下载 LLMtrans 客户端</h2>
      <p>客户端目前采用邀请体验方式。请输入作者提供的邀请码，验证通过后将立即开始下载。</p>
    </div>
    <label class="download-gate-field">
      <span>邀请码 / INVITATION CODE</span>
      <input name="inviteCode" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="请输入 6 位邀请码" aria-describedby="download-gate-error" required />
    </label>
    <p class="download-gate-error" id="download-gate-error" role="alert" aria-live="polite"></p>
    <button class="download-gate-submit" type="submit">
      <span>验证并下载</span>
      <small>VERIFY & DOWNLOAD</small>
    </button>
    <div class="download-gate-contact">
      <span>还没有邀请码？</span>
      <p>可向作者申请体验资格</p>
      <a href="mailto:siamesewu@gmail.com">siamesewu@gmail.com</a>
    </div>
  </form>
`;
document.body.appendChild(downloadDialog);

const downloadForm = downloadDialog.querySelector("form");
const downloadInput = downloadDialog.querySelector("input");
const downloadError = downloadDialog.querySelector(".download-gate-error");
const downloadClose = downloadDialog.querySelector(".download-gate-close");

function closeDownloadGate() {
  downloadDialog.close();
}

document.querySelectorAll(`a[href="${downloadUrl}"]`).forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setDrawer(false);
    downloadForm.reset();
    downloadError.textContent = "";
    downloadInput.removeAttribute("aria-invalid");
    downloadDialog.showModal();
    window.requestAnimationFrame(() => downloadInput.focus());
  });
});

downloadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (downloadInput.value.trim() !== downloadInviteCode) {
    downloadError.textContent = "邀请码不正确，请检查后重新输入。";
    downloadInput.setAttribute("aria-invalid", "true");
    downloadInput.focus();
    downloadInput.select();
    return;
  }

  downloadError.textContent = "";
  downloadInput.removeAttribute("aria-invalid");
  closeDownloadGate();
  window.location.assign(downloadUrl);
});

downloadInput.addEventListener("input", () => {
  downloadError.textContent = "";
  downloadInput.removeAttribute("aria-invalid");
});
downloadClose.addEventListener("click", closeDownloadGate);
downloadDialog.addEventListener("click", (event) => {
  if (event.target === downloadDialog) closeDownloadGate();
});

const toast = document.createElement("div");
toast.className = "feature-toast";
toast.setAttribute("role", "status");
toast.setAttribute("aria-live", "polite");
document.body.appendChild(toast);
let toastTimer;

document.querySelectorAll(".unavailable-action").forEach((button) => {
  button.addEventListener("click", () => {
    const feature = button.dataset.feature || "该功能";
    toast.innerHTML = `<b>${feature}尚未开发</b><span>当前页面仅用于产品概念展示，敬请期待后续版本。</span>`;
    toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3200);
  });
});

if (document.body.dataset.page === "vpn") {
  const video = document.querySelector("#vpn-video");
  const source = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

  if (video && window.Hls?.isSupported()) {
    const hls = new window.Hls({capLevelToPlayerSize: true, maxBufferLength: 30});
    hls.loadSource(source);
    hls.attachMedia(video);
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
  } else if (video?.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = source;
    video.addEventListener("loadedmetadata", () => video.play().catch(() => {}), {once: true});
  }
}

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.12});
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}
