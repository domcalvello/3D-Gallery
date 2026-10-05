const projects = [
  {
    title: "Circus Circus",
    category: "Branding + Full Web Experience",
    images: ["assets/circus-circus-long.webp", "assets/circus-circus-long.webp"],
    panelAlts: ["opening section", "later section"],
    slug: "circus-circus",
  },
  {
    title: "Magnus Oculus",
    category: "Graphic Design + Web Design",
    image: "assets/magnus-oculus-long.webp",
    surface: "black",
    fit: "cover",
  },
  {
    title: "System Strike",
    category: "Graphic Design + Web Design",
    image: "assets/system-strike-long.webp",
    surface: "black",
    fit: "cover",
  },
  {
    title: "Buffalo / Remixed",
    category: "Clothing Design + Web Design",
    image: "assets/buffalo-remixed.webp",
    fit: "cover",
  },
  {
    title: "Cybersecurity 32X",
    category: "Game Design + Web Design",
    image: "assets/cybersecurity-32x.webp",
    surface: "black",
    fit: "cover",
  },
  {
    title: "Docklight Lobster House",
    category: "Graphic Design + Web Design",
    image: "assets/lobster-house-long.webp",
    surface: "warm-paper",
    fit: "cover",
  },
  {
    title: "JACKPOT Music Hub",
    category: "Graphic Design + Web Design",
    image: "assets/jackpot-site.webp",
    surface: "black",
    fit: "cover",
  },
  {
    title: "DOM:CLOUD",
    category: "Portfolio System + Web Design",
    image: "assets/domcloud-portfolio.webp",
    surface: "black",
    fit: "cover",
  },
  {
    title: "Byte Vermin",
    category: "Product Design + Web Design",
    image: "assets/byte-vermin.webp",
    fit: "cover",
  },
  {
    title: "Rembrandt × Marvel",
    category: "Exhibition Concept + Web Design",
    images: [
      "assets/rembrandt-marvel-long-1.webp",
      "assets/rembrandt-marvel-long-2.webp",
    ],
    slug: "rembrandt-marvel",
  },
  {
    title: "JACKPOT — YouTube",
    category: "Video Production + Channel Design",
    image: "assets/jackpot-youtube.webp",
  },
  {
    title: "JACKPOT — SoundCloud",
    category: "Branding + Graphic Design + Music Production",
    image: "assets/jackpot-soundcloud.webp",
  },
  {
    title: "Shooter McNappin — SoundCloud",
    category: "Branding + Graphic Design + Music Production",
    image: "assets/shooter-mcnappin.webp",
  },
  {
    title: "SwaggleRock Edits — SoundCloud",
    category: "Branding + Graphic Design + Music Production",
    image: "assets/swagglerock-edits.webp",
  },
  {
    title: "SwaggleRock Playlists — SoundCloud",
    category: "Branding + Graphic Design + Music Production",
    image: "assets/swagglerock-playlists.webp",
  },
  {
    title: "SwaggleRock Tracks — SoundCloud",
    category: "Branding + Graphic Design + Music Production",
    image: "assets/swagglerock-tracks.webp",
  },
];

const root = document.documentElement;
const carousel = document.querySelector("[data-carousel]");
const ring = document.querySelector("[data-ring]");
const currentLabel = document.querySelector("[data-current]");
const categoryLabel = document.querySelector("[data-category]");
const titleLabel = document.querySelector("[data-title]");
const liveRegion = document.querySelector("[data-live]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const count = projects.length;
const step = 360 / count;
let radius = 900;
let rotation = 0;
let targetRotation = 0;
let activeIndex = 0;
let renderFrame = 0;
let wheelLocked = false;
let isDragging = false;
let dragMoved = false;
let pointerId = null;
let startX = 0;
let startRotation = 0;
let lastX = 0;
let lastTime = 0;
let velocity = 0;

const cards = projects.map((project, index) => {
  const card = document.createElement("button");
  const artwork = document.createElement("div");
  const imagePaths = project.images ?? [project.image];

  card.className = "portfolio-card";
  card.type = "button";
  card.dataset.index = String(index);
  card.dataset.project = project.slug ?? "";
  card.dataset.surface = project.surface ?? "white";
  card.dataset.fit = project.fit ?? "contain";
  card.setAttribute("role", "group");
  card.setAttribute("aria-roledescription", "slide");
  card.setAttribute("aria-label", `${project.title}, ${index + 1} of ${count}`);

  artwork.className = "portfolio-artwork";
  artwork.dataset.panels = String(imagePaths.length);
  card.dataset.panels = String(imagePaths.length);

  imagePaths.forEach((path, imageIndex) => {
    const image = document.createElement("img");
    image.src = path;
    image.alt = project.panelAlts
      ? `${project.title} website presentation, ${project.panelAlts[imageIndex]}`
      : imagePaths.length > 1
        ? `${project.title} full website presentation, page ${imageIndex + 1} of ${imagePaths.length}`
        : `${project.title} full website presentation`;
    image.draggable = false;
    image.decoding = "async";
    image.loading = index < 3 ? "eager" : "lazy";
    image.fetchPriority = index === 0 ? "high" : "auto";
    image.addEventListener("load", () => card.dataset.loaded = "true", { once: true });
    image.addEventListener("error", () => {
      card.dataset.failed = "true";
      image.alt = `${project.title} image unavailable`;
    });
    if (imagePaths.length > 1) {
      const panel = document.createElement("div");
      panel.className = "portfolio-panel";
      panel.append(image);
      artwork.append(panel);
    } else {
      artwork.append(image);
    }
  });

  card.append(artwork);
  card.addEventListener("click", () => {
    if (dragMoved) return;
    if (index === activeIndex) {
      moveBy(1);
    } else {
      goToIndex(index);
    }
  });

  ring.append(card);
  return card;
});

function normalizeAngle(degrees) {
  return ((degrees + 180) % 360 + 360) % 360 - 180;
}

function nearestRotationFor(index) {
  const base = -index * step;
  return base + Math.round((rotation - base) / 360) * 360;
}

function getActiveIndex() {
  return ((Math.round(-rotation / step) % count) + count) % count;
}

function setRadius() {
  const cardWidth = Number.parseFloat(getComputedStyle(cards[0]).width);
  const gap = window.innerWidth <= 820 ? 22 : 42;
  radius = (cardWidth + gap) / (2 * Math.tan(Math.PI / count));
}

function updateReadout(index, announce = false) {
  const project = projects[index];
  currentLabel.textContent = String(index + 1).padStart(2, "0");
  categoryLabel.textContent = project.category;
  titleLabel.textContent = project.title;
  document.title = `${project.title} — Selected Work`;
  if (announce) {
    liveRegion.textContent = `${project.title}, ${project.category}, project ${index + 1} of ${count}`;
  }
}

function render() {
  renderFrame = 0;
  const nextActive = getActiveIndex();

  cards.forEach((card, index) => {
    const angle = normalizeAngle(index * step + rotation);
    const radians = (angle * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const x = radius * Math.sin(radians);
    const z = radius * (cosine - 1);
    const visibility = Math.max(0, cosine);
    const isActive = index === nextActive;
    const scale = (0.82 + 0.18 * cosine) * (isActive ? 1.1 : 1);
    const opacity = 0.035 + 0.965 * Math.pow(visibility, 2.4);
    const brightness = 0.32 + 0.68 * ((cosine + 1) / 2);
    const canInteract = Math.abs(angle) <= step * 2.25;

    card.style.transform = `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${-angle}deg) scale(${scale})`;
    card.style.opacity = String(opacity);
    card.style.filter = `brightness(${brightness}) saturate(${0.66 + visibility * 0.34})`;
    card.style.zIndex = String(Math.round(2000 + z));
    card.style.pointerEvents = canInteract ? "auto" : "none";
    card.dataset.active = String(isActive);
    card.tabIndex = isActive ? 0 : -1;
    card.setAttribute("aria-hidden", String(!isActive));
  });

  if (nextActive !== activeIndex) {
    activeIndex = nextActive;
    updateReadout(activeIndex, true);
  }
}

function scheduleRender() {
  if (!renderFrame) renderFrame = requestAnimationFrame(render);
}

function animateToTarget() {
  if (isDragging) return;
  const difference = targetRotation - rotation;

  if (reduceMotion.matches || Math.abs(difference) < 0.012) {
    rotation = targetRotation;
    render();
    return;
  }

  rotation += difference * 0.145;
  render();
  requestAnimationFrame(animateToTarget);
}

function settle(projectedRotation = rotation) {
  targetRotation = Math.round(projectedRotation / step) * step;
  animateToTarget();
}

function goToIndex(index) {
  const normalized = ((index % count) + count) % count;
  targetRotation = nearestRotationFor(normalized);
  animateToTarget();
}

function moveBy(direction) {
  goToIndex(activeIndex + direction);
}

carousel.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  isDragging = true;
  dragMoved = false;
  pointerId = event.pointerId;
  startX = event.clientX;
  startRotation = rotation;
  lastX = event.clientX;
  lastTime = performance.now();
  velocity = 0;
  carousel.dataset.dragging = "true";
  carousel.setPointerCapture(pointerId);
});

carousel.addEventListener("pointermove", (event) => {
  const pointerX = (event.clientX / window.innerWidth) * 100;
  const pointerY = (event.clientY / window.innerHeight) * 100;
  const normalizedX = (pointerX - 50) / 50;
  const normalizedY = (pointerY - 50) / 50;
  root.style.setProperty("--pointer-x", `${pointerX}%`);
  root.style.setProperty("--pointer-y", `${pointerY}%`);

  if (!reduceMotion.matches && !isDragging) {
    root.style.setProperty("--tilt-y", `${normalizedX * 6}deg`);
    root.style.setProperty("--tilt-x", `${-normalizedY * 3.5}deg`);
    root.style.setProperty("--shift-x", `${normalizedX * 24}px`);
    root.style.setProperty("--shift-y", `${normalizedY * 14}px`);
  }

  if (!isDragging || event.pointerId !== pointerId) return;
  const now = performance.now();
  const delta = event.clientX - startX;
  const frameDelta = event.clientX - lastX;
  const elapsed = Math.max(8, now - lastTime);
  const dragScale = window.innerWidth <= 820 ? 0.18 : 0.14;

  if (Math.abs(delta) > 4) dragMoved = true;
  rotation = startRotation + delta * dragScale;
  velocity = (frameDelta * dragScale) / elapsed;
  lastX = event.clientX;
  lastTime = now;
  scheduleRender();
});

carousel.addEventListener("pointerleave", () => {
  if (isDragging || reduceMotion.matches) return;
  root.style.setProperty("--tilt-y", "0deg");
  root.style.setProperty("--tilt-x", "0deg");
  root.style.setProperty("--shift-x", "0px");
  root.style.setProperty("--shift-y", "0px");
});

function endDrag(event) {
  if (!isDragging || event.pointerId !== pointerId) return;
  isDragging = false;
  carousel.dataset.dragging = "false";
  if (carousel.hasPointerCapture(pointerId)) carousel.releasePointerCapture(pointerId);
  pointerId = null;
  settle(rotation + velocity * 110);
  window.setTimeout(() => {
    dragMoved = false;
  }, 0);
}

carousel.addEventListener("pointerup", endDrag);
carousel.addEventListener("pointercancel", endDrag);

carousel.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    if (wheelLocked) return;
    const intent = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(intent) < 3) return;
    wheelLocked = true;
    moveBy(intent > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLocked = false;
    }, 280);
  },
  { passive: false },
);

carousel.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveBy(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveBy(-1);
  } else if (event.key === "Home") {
    event.preventDefault();
    goToIndex(0);
  } else if (event.key === "End") {
    event.preventDefault();
    goToIndex(count - 1);
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    moveBy(1);
  }
});

document.querySelector("[data-previous]").addEventListener("click", () => moveBy(-1));
document.querySelector("[data-next]").addEventListener("click", () => moveBy(1));
window.addEventListener("resize", () => {
  setRadius();
  scheduleRender();
});

setRadius();
updateReadout(0);
render();
requestAnimationFrame(() => document.body.classList.add("is-ready"));
