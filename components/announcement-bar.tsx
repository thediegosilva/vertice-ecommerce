const MESSAGES = [
  "FRETE GRÁTIS acima de R$ 399",
  "Use VERTICE10 e ganhe 10% OFF",
  "Parcele em até 10x sem juros",
  "Troca grátis em até 30 dias",
];

export function AnnouncementBar() {
  const items = [...MESSAGES, ...MESSAGES];
  return (
    <div className="overflow-hidden bg-night text-chalk" role="region" aria-label="Avisos da loja">
      <div className="flex w-max animate-marquee gap-12 py-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
        {items.map((m, i) => (
          <span key={i} className="flex items-center gap-12" aria-hidden={i >= MESSAGES.length}>
            {m}
            <span className="text-flame">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
