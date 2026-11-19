"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { addReviewAction } from "@/actions/store";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return <p className="rounded-md bg-stone2 p-4 text-sm font-semibold">Obrigado pela avaliação! 🧡</p>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await addReviewAction({ productId, rating, title: title || undefined, comment });
          if (res.ok) {
            setDone(true);
            toast.success("Avaliação publicada");
          } else toast.error(res.error);
        });
      }}
      className="space-y-4 rounded-md border bg-card p-5"
    >
      <p className="font-semibold">Avalie este produto</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Nota">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} estrela${i > 1 ? "s" : ""}`} onClick={() => setRating(i)}>
            <Star className={cn("size-6", i <= rating ? "fill-flame text-flame" : "text-stone2")} />
          </button>
        ))}
      </div>
      <div>
        <Label htmlFor="rv-title">Título (opcional)</Label>
        <Input id="rv-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="rv-comment">Comentário</Label>
        <Textarea id="rv-comment" value={comment} required minLength={10} maxLength={1000} onChange={(e) => setComment(e.target.value)} className="mt-1.5" />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Enviando…" : "Publicar avaliação"}</Button>
    </form>
  );
}
