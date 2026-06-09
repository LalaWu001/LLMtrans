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
