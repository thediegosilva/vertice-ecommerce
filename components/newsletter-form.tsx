"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletterAction } from "@/actions/store";
import { cn } from "@/lib/utils";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await subscribeNewsletterAction({ email });
          if (res.ok) {
            setDone(true);
            setEmail("");
            toast.success("Inscrição confirmada! Fique de olho no seu email.");
          } else toast.error(res.error);
        });
      }}
      className={cn("flex w-full overflow-hidden rounded-md border", dark ? "border-white/20" : "border-ink")}
    >
      <label htmlFor={dark ? "nl-footer" : "nl-home"} className="sr-only">Seu email</label>
      <input
        id={dark ? "nl-footer" : "nl-home"}
        type="email"
        required
        maxLength={254}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className={cn("h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:opacity-60", dark ? "text-white" : "text-ink")}
      />
      <button
        type="submit"
        disabled={pending}
        aria-label="Inscrever"
        className={cn("flex h-12 items-center gap-2 px-5 text-sm font-bold transition disabled:opacity-60", dark ? "bg-flame text-white hover:bg-flame-dark" : "bg-ink text-paper hover:bg-flame")}
      >
        {done ? <Check className="size-4" /> : <ArrowRight className="size-4" />}
      </button>
    </form>
  );
}
