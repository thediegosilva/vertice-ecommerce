const WORDS = ["Calçados", "Vestuário", "Tech", "Acessórios", "Beleza", "Frete grátis", "10x sem juros"];

/** Duas faixas gigantes inclinadas rolando em sentidos opostos (sólida + contorno). */
export function KineticBand() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="relative -my-6 overflow-hidden py-14 sm:py-20" aria-hidden>
      <div className="-rotate-[3deg] scale-110 bg-flame py-3 sm:py-5">
        <div className="kinetic-row flex w-max items-center gap-8 whitespace-nowrap">
          {row.map((w, i) => (
            <span key={i} className="flex items-center gap-8 font-display text-3xl font-black uppercase tracking-tight text-white sm:text-6xl">
              {w}
              <span className="text-xl text-night sm:text-3xl">✦</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mt-2 rotate-[2deg] scale-110 py-2 sm:mt-4">
        <div className="kinetic-row reverse flex w-max items-center gap-8 whitespace-nowrap">
          {row.map((w, i) => (
            <span key={i} className="flex items-center gap-8 font-display text-3xl font-black uppercase tracking-tight sm:text-6xl">
              <span className="kinetic-outline">{w}</span>
              <span className="size-3 rotate-45 bg-flame sm:size-4" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
