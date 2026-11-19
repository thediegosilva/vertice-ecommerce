/** Pseudo-aleatório determinístico (igual no servidor e no cliente) */
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  // arredonda para evitar diferenças de ponto flutuante entre servidor e cliente
  return Math.round((x - Math.floor(x)) * 1000) / 1000;
};

const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  left: `${(rand(i + 100) * 100).toFixed(1)}%`,
  size: `${(2 + rand(i + 130) * 3).toFixed(1)}px`,
  duration: `${(9 + rand(i + 160) * 10).toFixed(1)}s`,
  delay: `${(-rand(i + 190) * 18).toFixed(1)}s`,
  drift: `${((rand(i + 220) - 0.5) * 120).toFixed(0)}px`,
}));

/** Brasas laranja subindo no hero — só CSS, sem custo de JS por frame. */
export function HeroEmbers() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden" aria-hidden>
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="hero-ember absolute bottom-0 rounded-full"
          style={{ left: e.left, width: e.size, height: e.size, animationDuration: e.duration, animationDelay: e.delay, "--drift": e.drift } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
