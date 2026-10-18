/* Ambient network and reading progress. Respects reduced motion and tab visibility. */
(() => {
  "use strict";
  const root = document.documentElement;
  const canvas = document.getElementById("ambient-network");
  const context = canvas?.getContext("2d");
  const header = document.querySelector(".site-header");
  const toggle = document.getElementById("toggle-motion");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let requested = true;
  let running = false;
  let frame = 0;
  let elapsed = 0;
  let lastFrame = 0;
  let width = 0;
  let height = 0;
  let nodes = [];
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function resize() {
    if (!context) return;
    width = document.documentElement.clientWidth;
    height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const perSide = width < 600 ? 9 : 22;
    // Each cluster stays in the margins; the center is masked for readability.
    nodes = Array.from({ length: perSide * 2 }, (_, index) => {
      const right = index >= perSide;
      const slot = index % perSide;
      const localX = (0.025 + Math.random() * 0.14) * width;
      return {
        x: right ? width - localX : localX,
        y: ((slot + 0.5) / perSide) * height,
        phase: Math.random() * Math.PI * 2,
        speed: 0.32 + Math.random() * 0.18,
        radius: 1.5 + Math.random() * 1.1,
        drift: 24 + Math.random() * 22,
        right
      };
    });
    draw();
  }

  function draw() {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const time = elapsed / 1000;
    const points = nodes.map(node => ({
      ...node,
      x: node.x + Math.sin(time * node.speed + node.phase) * node.drift + pointer.x,
      y: node.y + Math.cos(time * node.speed * 0.7 + node.phase) * node.drift + pointer.y
    }));
    const reach = Math.min(175, height * 0.23);
    for (let i = 0; i < points.length; i++) {
      const from = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const to = points[j];
        if (from.right !== to.right) continue;
        const distance = Math.hypot(from.x - to.x, from.y - to.y);
        if (distance > reach) continue;
        const opacity = (1 - distance / reach) * 0.29;
        context.strokeStyle = `rgba(67, 105, 83, ${opacity})`;
        context.lineWidth = 0.85;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        // Small signals travel along selected edges to make the network feel alive.
        if ((i * 19 + j * 7) % 6 === 0 && distance > 35) {
          const progress = (time * 0.17 + (i + j) * 0.13) % 1;
          const brightness = Math.sin(progress * Math.PI) * 0.6;
          const x = from.x + (to.x - from.x) * progress;
          const y = from.y + (to.y - from.y) * progress;
          context.beginPath();
          context.arc(x, y, 2, 0, Math.PI * 2);
          context.fillStyle = `rgba(52, 113, 78, ${brightness})`;
          context.fill();
        }
      }
      context.beginPath();
      context.arc(from.x, from.y, from.radius, 0, Math.PI * 2);
      context.fillStyle = "rgba(74, 111, 87, 0.4)";
      context.fill();
    }
  }

  function animate(now) {
    frame = 0;
    if (!running || document.hidden) return;
    if (!lastFrame) lastFrame = now;
    const delta = now - lastFrame;
    // Limit redraws to about 30 fps; motion stays deliberately slow.
    if (delta >= 1000 / 30) {
      elapsed += Math.min(delta, 100);
      lastFrame = now;
      pointer.x += (pointer.targetX - pointer.x) * 0.045;
      pointer.y += (pointer.targetY - pointer.y) * 0.045;
      draw();
    }
    frame = window.requestAnimationFrame(animate);
  }

  function updateMotion() {
    running = requested && !reduceMotion.matches;
    root.dataset.motion = running ? "on" : "off";
    toggle.setAttribute("aria-pressed", String(running));
    toggle.textContent = reduceMotion.matches ? "Motion: reduced" : `Motion: ${running ? "on" : "off"}`;
    toggle.disabled = reduceMotion.matches;
    toggle.title = reduceMotion.matches ? "Following your reduced motion preference" : "Toggle background animation and navigation glow";
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    if (running && !document.hidden && context) frame = window.requestAnimationFrame(animate);
    else draw();
  }

  let scrollFrame = 0;
  function updateProgress() {
    scrollFrame = 0;
    const length = root.scrollHeight - window.innerHeight;
    const progress = length > 0 ? Math.min(1, Math.max(0, window.scrollY / length)) : 0;
    root.style.setProperty("--reading-progress", progress.toFixed(4));
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  function scheduleProgress() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateProgress);
  }
  window.addEventListener("scroll", scheduleProgress, { passive: true });
  window.addEventListener("resize", () => { resize(); scheduleProgress(); }, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(scheduleProgress).observe(document.body);
  document.addEventListener("visibilitychange", () => {
    root.classList.toggle("page-is-hidden", document.hidden);
    updateMotion();
  });
  window.addEventListener("pagehide", () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  });
  window.addEventListener("pageshow", updateMotion);
  reduceMotion.addEventListener("change", updateMotion);
  toggle.addEventListener("click", () => { requested = !requested; updateMotion(); });

  window.addEventListener("pointermove", event => {
    if (!running || !finePointer.matches || event.pointerType === "touch") return;
    pointer.targetX = (event.clientX / Math.max(width, 1) - 0.5) * 22;
    pointer.targetY = (event.clientY / Math.max(height, 1) - 0.5) * 22;
  }, { passive: true });
  header.addEventListener("pointermove", event => {
    if (!running || !finePointer.matches || event.pointerType === "touch") return;
    header.style.setProperty("--nav-pointer-x", `${event.clientX}px`);
    header.classList.add("is-hovered");
  }, { passive: true });
  header.addEventListener("pointerleave", () => {
    header.classList.remove("is-hovered");
    pointer.targetX = 0;
    pointer.targetY = 0;
  });
  document.documentElement.addEventListener("pointerleave", () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  });

  resize();
  updateProgress();
  updateMotion();
})();
