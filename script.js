const canvas = document.getElementById("neural-canvas");
const context = canvas.getContext("2d");
const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("[data-menu]");
const revealItems = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("main section[id]");
const navAnchors = document.querySelectorAll(".nav-links a");
const heroVisual = document.querySelector(".hero-visual");
const loader = document.querySelector(".loader");
const interactiveButtons = document.querySelectorAll(".button, .nav-cta");

let width = 0;
let height = 0;
let points = [];
let animationFrame;
let scrollTicking = false;
let pointer = { x: 0, y: 0, active: false };

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  createPoints();
}

function createPoints() {
  const density = width < 700 ? 52 : 112;
  points = Array.from({ length: density }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.26,
    vy: (Math.random() - 0.5) * 0.26,
    pulse: Math.random() * Math.PI * 2,
    size: 0.7 + Math.random() * 1.8,
    depth: 0.35 + Math.random() * 0.9,
    beam: Math.random() > 0.88
  }));
}

function drawNetwork() {
  context.clearRect(0, 0, width, height);

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(0, 148, 255, 0.02)");
  gradient.addColorStop(1, "rgba(0, 229, 255, 0.08)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  points.forEach((point, index) => {
    point.x += point.vx * point.depth;
    point.y += point.vy * point.depth;
    point.pulse += 0.025;

    if (point.x < 0 || point.x > width) point.vx *= -1;
    if (point.y < 0 || point.y > height) point.vy *= -1;

    for (let nextIndex = index + 1; nextIndex < points.length; nextIndex += 1) {
      const next = points[nextIndex];
      const distance = Math.hypot(point.x - next.x, point.y - next.y);

      if (distance < 138) {
        const alpha = (1 - distance / 138) * 0.18 * point.depth;
        context.strokeStyle = `rgba(0, 148, 255, ${alpha})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(next.x, next.y);
        context.stroke();
      }
    }

    if (pointer.active) {
      const pointerDistance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
      if (pointerDistance < 190) {
        const alpha = (1 - pointerDistance / 190) * 0.28;
        context.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(pointer.x, pointer.y);
        context.stroke();
      }
    }

    if (point.beam) {
      const beamLength = 26 + point.depth * 30;
      context.strokeStyle = `rgba(105, 215, 255, ${0.12 * point.depth})`;
      context.beginPath();
      context.moveTo(point.x - beamLength, point.y + beamLength * 0.18);
      context.lineTo(point.x + beamLength, point.y - beamLength * 0.18);
      context.stroke();
    }

    const radius = point.size + Math.sin(point.pulse) * 0.45;
    context.fillStyle = "rgba(105, 215, 255, 0.75)";
    context.shadowBlur = 10;
    context.shadowColor = "rgba(0, 148, 255, 0.9)";
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
  });

  animationFrame = window.requestAnimationFrame(drawNetwork);
}

function setupLoading() {
  const hideLoader = () => {
    if (!loader) return;
    loader.classList.add("is-hidden");
    document.body.classList.add("is-ready");
    window.setTimeout(() => {
      loader.style.display = "none";
    }, 700);
  };

  window.setTimeout(hideLoader, 900);
  window.addEventListener("load", () => window.setTimeout(hideLoader, 350), { once: true });
}

function setupMenu() {
  if (!menuButton || !menu) return;

  menuButton.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

function setupRevealAnimation() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          entry.target.closest("section")?.classList.add("section-in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupScrollParallax() {
  const updateScroll = () => {
    document.documentElement.style.setProperty("--scroll-y", String(window.scrollY));
    scrollTicking = false;
  };

  updateScroll();
  window.addEventListener(
    "scroll",
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(updateScroll);
    },
    { passive: true }
  );
}

function setupActiveNavigation() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navAnchors.forEach((anchor) => {
          anchor.classList.toggle("is-active", anchor.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-42% 0px -48% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupHeroParallax() {
  if (!heroVisual || window.matchMedia("(pointer: coarse)").matches) return;

  window.addEventListener("mousemove", (event) => {
    pointer = { x: event.clientX, y: event.clientY, active: true };
    const x = (event.clientX / window.innerWidth - 0.5) * 10;
    const y = (event.clientY / window.innerHeight - 0.5) * 10;
    heroVisual.style.setProperty("--tilt-x", `${-y}deg`);
    heroVisual.style.setProperty("--tilt-y", `${x}deg`);
  });

  window.addEventListener("mouseleave", () => {
    pointer.active = false;
    heroVisual.style.setProperty("--tilt-x", "0deg");
    heroVisual.style.setProperty("--tilt-y", "0deg");
  });
}

function setupButtonMicroInteractions() {
  interactiveButtons.forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      button.style.setProperty("--spot-x", `${x}%`);
      button.style.setProperty("--spot-y", `${y}%`);
    });
  });
}

function setupForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  form.addEventListener("submit", () => {
    const button = form.querySelector("button");

    if (!button) return;

    button.textContent = "Enviando...";
    button.disabled = true;
  });
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", () => window.cancelAnimationFrame(animationFrame));

setupLoading();
resizeCanvas();
drawNetwork();
setupMenu();
setupRevealAnimation();
setupActiveNavigation();
setupScrollParallax();
setupHeroParallax();
setupButtonMicroInteractions();
setupForm();
