import confetti from "canvas-confetti";

// Instância sem Web Worker (compatível com a CSP estrita: sem blob: workers)
let instance: confetti.CreateTypes | null = null;
function get() {
  instance ??= confetti.create(undefined, { resize: true, useWorker: false, disableForReducedMotion: true });
  return instance;
}

const COLORS = ["#FF4D00", "#FF9A5C", "#111111", "#FAF9F6", "#E8E6E1"];

/** Explosão curta a partir de um elemento (ex.: cupom aplicado). */
export function burstFrom(el: Element | null) {
  const r = el?.getBoundingClientRect();
  const origin = r ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight } : { x: 0.5, y: 0.5 };
  get()({ particleCount: 70, spread: 70, startVelocity: 35, origin, colors: COLORS, scalar: 0.9, ticks: 160 });
}

/** Celebração de pedido confirmado: dois canhões laterais. */
export function celebrate() {
  const fire = get();
  const end = Date.now() + 1200;
  (function frame() {
    fire({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS });
    fire({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
