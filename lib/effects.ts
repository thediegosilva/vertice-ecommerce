/**
 * Efeitos de interface em Vanilla JS (sem re-render do React) — mesmo padrão
 * do portfólio (diego-portfolio/src/lib/effects.ts), adaptado à loja.
 *
 *  [data-reveal]     -> fade-up + blur ao entrar na viewport (IntersectionObserver)
 *  [data-spotlight]  -> brilho radial que segue o cursor (CSS vars --mx / --my)
 *  [data-magnetic]   -> elemento atraído levemente pelo cursor
 *  [data-tilt]       -> inclinação 3D sutil
 *  [data-scramble]   -> texto que "decodifica" ao aparecer
 *  [data-parallax]   -> deslocamento suave no scroll
 *  :root --scroll    -> progresso de rolagem (barra no topo)
 *
 * Tudo é delegado no document e atualizado no máximo 1x por frame (rAF).
 */

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function initReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
  );
  const observe = (root: ParentNode) =>
    root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)").forEach((el) => io.observe(el));
  observe(document);
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches("[data-reveal]")) io.observe(node);
        observe(node);
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
  return () => {
    io.disconnect();
    mo.disconnect();
  };
}

function initPointer() {
  if (!finePointer()) return () => {};
  let frame = 0;
  let last: PointerEvent | null = null;
  let magneticEl: HTMLElement | null = null;
  let tiltEl: HTMLElement | null = null;

  const resetMagnetic = () => {
    if (magneticEl) magneticEl.style.transform = "";
    magneticEl = null;
  };
  const resetTilt = () => {
    if (tiltEl) tiltEl.style.transform = "";
    tiltEl = null;
  };

  const update = () => {
    frame = 0;
    const e = last;
    if (!e) return;
    const target = e.target as Element | null;

    let node = target?.closest?.<HTMLElement>("[data-spotlight]") ?? null;
    while (node) {
      const r = node.getBoundingClientRect();
      node.style.setProperty("--mx", `${e.clientX - r.left}px`);
      node.style.setProperty("--my", `${e.clientY - r.top}px`);
      node = node.parentElement?.closest<HTMLElement>("[data-spotlight]") ?? null;
    }
    if (prefersReducedMotion()) return;

    const mag = target?.closest?.<HTMLElement>("[data-magnetic]") ?? null;
    if (mag !== magneticEl) resetMagnetic();
    if (mag) {
      magneticEl = mag;
      const r = mag.getBoundingClientRect();
      const strength = Number(mag.dataset.magnetic) || 0.25;
      mag.style.transform = `translate3d(${(e.clientX - (r.left + r.width / 2)) * strength}px, ${(e.clientY - (r.top + r.height / 2)) * strength}px, 0)`;
    }

    const tilt = target?.closest?.<HTMLElement>("[data-tilt]") ?? null;
    if (tilt !== tiltEl) resetTilt();
    if (tilt) {
      tiltEl = tilt;
      const r = tilt.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(1000px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-4px)`;
    }
  };

  const onMove = (e: PointerEvent) => {
    last = e;
    if (!frame) frame = requestAnimationFrame(update);
  };
  const onLeave = () => {
    resetMagnetic();
    resetTilt();
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  window.addEventListener("blur", onLeave);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("blur", onLeave);
  };
}

function initScrollProgress() {
  const root = document.documentElement;
  let frame = 0;
  const update = () => {
    frame = 0;
    const max = root.scrollHeight - window.innerHeight;
    root.style.setProperty("--scroll", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";

function scramble(el: HTMLElement) {
  const final = el.dataset.text ?? el.textContent ?? "";
  el.dataset.text = final;
  const duration = Number(el.dataset.scrambleDuration) || 800;
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const revealed = Math.floor(p * final.length);
    let out = "";
    for (let i = 0; i < final.length; i++) {
      const ch = final[i];
      out += i < revealed || ch === " " || ch === "·" ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initScramble() {
  if (prefersReducedMotion()) return () => {};
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        io.unobserve(el);
        setTimeout(() => scramble(el), Number(el.dataset.scramble) || 0);
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  document.querySelectorAll<HTMLElement>("[data-scramble]").forEach((el) => io.observe(el));
  return () => io.disconnect();
}

function initParallax() {
  if (prefersReducedMotion()) return () => {};
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
  if (!els.length) return () => {};
  let frame = 0;
  const update = () => {
    frame = 0;
    const y = window.scrollY;
    if (y > window.innerHeight * 1.5) return;
    for (const el of els) el.style.translate = `0 ${(y * Number(el.dataset.parallax)).toFixed(1)}px`;
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

/** Efeitos globais (uma vez por sessão) */
export function initGlobalEffects() {
  const cleanups = [initReveal(), initPointer(), initScrollProgress()];
  return () => cleanups.forEach((fn) => fn());
}

/** Efeitos por página (re-escaneia o DOM a cada navegação) */
export function initPageEffects() {
  const cleanups = [initScramble(), initParallax()];
  return () => cleanups.forEach((fn) => fn());
}

/** Anima uma miniatura voando de um ponto até o ícone do carrinho. */
export function flyToCart(src: string, from: DOMRect) {
  if (prefersReducedMotion()) return;
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target) return;
  const to = target.getBoundingClientRect();
  const size = Math.min(140, Math.max(60, from.width * 0.4));
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.className = "fly-to-cart";
  Object.assign(img.style, {
    width: `${size}px`,
    height: `${size}px`,
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
  });
  document.body.appendChild(img);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const anim = img.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.25 - 80}px) scale(0.7)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.4 },
    ],
    { duration: 750, easing: "cubic-bezier(0.5, 0, 0.3, 1)" },
  );
  anim.onfinish = () => {
    img.remove();
    target.classList.remove("cart-bump");
    void target.offsetWidth;
    target.classList.add("cart-bump");
  };
}
