import React from "react";

type RevealProps = React.HTMLAttributes<HTMLElement> & {
  delay?: number;
  as?: "div" | "li" | "article" | "section" | "p" | "span" | "figure";
};

/** Marca o elemento com [data-reveal]; o fade-up é CSS ativado por lib/effects.ts. */
export function Reveal({ children, delay = 0, as = "div", style, ...rest }: RevealProps) {
  const Component = as as React.ElementType;
  return (
    <Component data-reveal="" style={{ ...style, "--delay": `${Math.round(delay * 1000)}ms` } as React.CSSProperties} {...rest}>
      {children}
    </Component>
  );
}

/** Título que se monta palavra por palavra quando o [data-reveal] ancestral fica visível. */
export function SplitWords({ text, accent, className }: { text: string; accent?: string; className?: string }) {
  const words = text.split(" ").filter(Boolean);
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="split-word" aria-hidden>
            <span className={`split-word-inner ${accent && w === accent ? "text-flame" : ""}`} style={{ "--i": i } as React.CSSProperties}>
              {w}
            </span>
          </span>
          {i < words.length - 1 && " "}
        </React.Fragment>
      ))}
    </span>
  );
}

/** Letras que sobem uma a uma (hero). Quebra linha entre palavras no mobile. */
export function SplitChars({ text, offset = 0, className = "" }: { text: string; offset?: number; className?: string }) {
  let k = offset;
  const words = text.split(" ");
  return (
    <span className={`[perspective:800px] ${className}`} aria-label={text}>
      {words.map((word, wi) => (
        <React.Fragment key={wi}>
          <span className="inline-block whitespace-nowrap" aria-hidden>
            {word.split("").map((ch, i) => (
              <span key={i} className="split-char" style={{ "--i": k++ } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 && (k++, " ")}
        </React.Fragment>
      ))}
    </span>
  );
}
