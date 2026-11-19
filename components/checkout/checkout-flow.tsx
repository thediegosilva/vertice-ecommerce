"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CreditCard, Lock, MapPin, Tag, Truck, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { placeOrderAction, quoteCheckoutAction } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { FreeShippingBar } from "@/components/cart-drawer";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { burstFrom } from "@/lib/confetti";
import { addressSchema, couponCodeSchema, UF } from "@/lib/validators";
import { SHIPPING_RATES_CENTS } from "@/lib/pricing";
import type { CartView } from "@/lib/cart";
import { cn, formatBRL, installments } from "@/lib/utils";

type Address = { id: string; label: string; recipient: string; zip: string; street: string; number: string; complement: string | null; district: string; city: string; state: string; phone: string | null; isDefault: boolean };
type AddressForm = { recipient: string; zip: string; street: string; number: string; complement: string; district: string; city: string; state: string; phone: string };
type Quote = { subtotalCents: number; discountCents: number; shippingCents: number; totalCents: number; missingForFreeShipping: number; couponError: string | null; couponApplied: string | null; problems: string[] };

const STEPS = ["Dados", "Pagamento", "Revisão"] as const;
const empty: AddressForm = { recipient: "", zip: "", street: "", number: "", complement: "", district: "", city: "", state: "SP", phone: "" };

function fromSaved(a: Address): AddressForm {
  return { recipient: a.recipient, zip: a.zip, street: a.street, number: a.number, complement: a.complement ?? "", district: a.district, city: a.city, state: a.state, phone: a.phone ?? "" };
}

export function CheckoutFlow({ cart, addresses, userName }: { cart: CartView; addresses: Address[]; userName: string }) {
  const [step, setStep] = useState(0);
  const def = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [selected, setSelected] = useState<string | "new">(def ? def.id : "new");
  const [form, setForm] = useState<AddressForm>(def ? fromSaved(def) : { ...empty, recipient: userName });
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | undefined>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [placing, startPlacing] = useTransition();
  const [quoting, setQuoting] = useState(false);

  const refreshQuote = useCallback(async (m: typeof method, c?: string) => {
    setQuoting(true);
    const res = await quoteCheckoutAction({ shippingMethod: m, couponCode: c });
    setQuoting(false);
    if (!res.ok) {
      toast.error(res.error);
      return null;
    }
    setQuote(res.data);
    return res.data;
  }, []);

  useEffect(() => {
    refreshQuote(method, coupon);
  }, [method, coupon, refreshQuote]);

  async function lookupCep(zip: string) {
    const digits = zip.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = (await r.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (d.erro) return;
      setForm((f) => ({
        ...f,
        street: d.logradouro?.slice(0, 120) || f.street,
        district: d.bairro?.slice(0, 60) || f.district,
        city: d.localidade?.slice(0, 60) || f.city,
        state: d.uf && (UF as readonly string[]).includes(d.uf) ? d.uf : f.state,
      }));
    } catch {
      /* preenchimento manual */
    }
  }

  function validateAddress() {
    const parsed = addressSchema.safeParse({ ...form, label: "Checkout" });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  }

  async function applyCoupon() {
    const parsed = couponCodeSchema.safeParse(couponInput);
    if (!parsed.success) {
      toast.error("Cupom inválido");
      return;
    }
    const q = await refreshQuote(method, parsed.data);
    if (q?.couponError) toast.error(q.couponError);
    else if (q) {
      setCoupon(parsed.data);
      burstFrom(document.querySelector("[data-testid=coupon-apply]"));
      toast.success(`Cupom ${parsed.data} aplicado!`);
    }
  }

  function placeOrder() {
    startPlacing(async () => {
      const res = await placeOrderAction({
        address: {
          recipient: form.recipient, zip: form.zip, street: form.street, number: form.number,
          complement: form.complement, district: form.district, city: form.city, state: form.state, phone: form.phone,
        },
        saveAddress: selected === "new" && saveAddress,
        shippingMethod: method,
        couponCode: coupon,
      });
      if (res.ok) window.location.assign(res.data.url);
      else toast.error(res.error);
    });
  }

  const field = (name: keyof AddressForm, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={props.className}>
      <Label htmlFor={`f-${name}`}>{label}</Label>
      <Input
        id={`f-${name}`}
        value={form[name]}
        aria-invalid={!!errors[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        className="mt-1.5"
        {...props}
      />
      <FieldError>{errors[name]}</FieldError>
    </div>
  );

  const inst = installments(quote?.totalCents ?? cart.subtotalCents);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
      <div>
        {/* Stepper */}
        <ol className="mb-10 flex items-center gap-2" aria-label="Etapas do checkout">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider disabled:cursor-default"
              >
                <span className={cn("flex size-8 items-center justify-center rounded-full border-2 text-xs", i < step ? "border-ink bg-ink text-paper" : i === step ? "border-flame bg-flame text-white" : "border-stone2 text-muted-foreground")}>
                  {i < step ? <Check className="size-4" /> : i + 1}
                </span>
                <span className={cn("hidden sm:inline", i > step && "text-muted-foreground")}>{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className="relative h-0.5 flex-1 overflow-hidden bg-stone2">
                  <motion.span className="absolute inset-y-0 left-0 bg-ink" initial={false} animate={{ width: i < step ? "100%" : "0%" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
                </span>
              )}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <section aria-labelledby="s1">
                <h2 id="s1" className="mb-6 flex items-center gap-2 font-display text-2xl font-extrabold uppercase"><MapPin className="size-5 text-flame" /> Endereço de entrega</h2>
                {addresses.length > 0 && (
                  <div className="mb-6 grid gap-3 sm:grid-cols-2">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          setSelected(a.id);
                          setForm(fromSaved(a));
                          setErrors({});
                        }}
                        className={cn("rounded-md border-2 bg-card p-4 text-left text-sm transition", selected === a.id ? "border-ink" : "border-transparent hover:border-stone2")}
                      >
                        <p className="font-bold">{a.label}{a.isDefault && <span className="ml-2 text-xs font-normal text-muted-foreground">padrão</span>}</p>
                        <p className="mt-1 text-muted-foreground">{a.recipient}<br />{a.street}, {a.number} — {a.district}<br />{a.city}/{a.state} · {a.zip.replace(/(\d{5})(\d{3})/, "$1-$2")}</p>
                      </button>
                    ))}
                    <button onClick={() => { setSelected("new"); setForm({ ...empty, recipient: userName }); }} className={cn("rounded-md border-2 border-dashed p-4 text-sm font-semibold", selected === "new" ? "border-ink" : "border-stone2")}>
                      + Novo endereço
                    </button>
                  </div>
                )}
                <div className={cn("grid gap-4 rounded-md bg-card p-5 sm:grid-cols-6", selected !== "new" && "opacity-90")}>
                  {field("recipient", "Destinatário", { className: "sm:col-span-4", autoComplete: "name", maxLength: 80 })}
                  {field("phone", "Telefone", { className: "sm:col-span-2", autoComplete: "tel", inputMode: "tel", maxLength: 20 })}
                  {field("zip", "CEP", { className: "sm:col-span-2", autoComplete: "postal-code", inputMode: "numeric", maxLength: 9, onBlur: (e) => lookupCep(e.target.value) })}
                  {field("street", "Rua", { className: "sm:col-span-4", autoComplete: "address-line1", maxLength: 120 })}
                  {field("number", "Número", { className: "sm:col-span-2", maxLength: 10 })}
                  {field("complement", "Complemento", { className: "sm:col-span-4", autoComplete: "address-line2", maxLength: 60 })}
                  {field("district", "Bairro", { className: "sm:col-span-2", maxLength: 60 })}
                  {field("city", "Cidade", { className: "sm:col-span-3", autoComplete: "address-level2", maxLength: 60 })}
                  <div className="sm:col-span-1">
                    <Label htmlFor="f-state">UF</Label>
                    <NativeSelect id="f-state" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className="mt-1.5">
                      {UF.map((u) => <option key={u}>{u}</option>)}
                    </NativeSelect>
                  </div>
                  {selected === "new" && (
                    <label className="flex items-center gap-2 text-sm sm:col-span-6">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="size-4 accent-flame" />
                      Salvar este endereço na minha conta
                    </label>
                  )}
                </div>
                <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={() => validateAddress() && setStep(1)} data-testid="step1-next">
                  Continuar para pagamento
                </Button>
              </section>
            )}

            {step === 1 && (
              <section aria-labelledby="s2" className="space-y-8">
                <div>
                  <h2 id="s2" className="mb-4 flex items-center gap-2 font-display text-2xl font-extrabold uppercase"><Truck className="size-5 text-flame" /> Entrega</h2>
                  <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                    {([
                      ["STANDARD", "Padrão", "3 a 7 dias úteis", Truck],
                      ["EXPRESS", "Expresso", "1 a 2 dias úteis", Zap],
                    ] as const).map(([key, label, eta, Icon]) => {
                      const price = key === "STANDARD" && quote && quote.missingForFreeShipping === 0 ? 0 : SHIPPING_RATES_CENTS[key];
                      return (
                        <button key={key} role="radio" aria-checked={method === key} onClick={() => setMethod(key)} className={cn("flex items-center gap-4 rounded-md border-2 bg-card p-4 text-left", method === key ? "border-ink" : "border-transparent hover:border-stone2")}>
                          <Icon className="size-6 text-flame" />
                          <div className="flex-1">
                            <p className="font-bold">{label}</p>
                            <p className="text-xs text-muted-foreground">{eta}</p>
                          </div>
                          <p className="font-bold">{price === 0 ? <span className="text-emerald-700 dark:text-emerald-400">Grátis</span> : formatBRL(price)}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-extrabold uppercase"><Tag className="size-5 text-flame" /> Cupom</h3>
                  {coupon ? (
                    <div className="flex items-center justify-between rounded-md border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 p-4">
                      <p className="text-sm"><b>{coupon}</b> aplicado · −{formatBRL(quote?.discountCents ?? 0)}</p>
                      <button onClick={() => { setCoupon(undefined); setCouponInput(""); }} aria-label="Remover cupom"><X className="size-4" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <label htmlFor="coupon" className="sr-only">Código do cupom</label>
                      <Input id="coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Ex: VERTICE10" maxLength={30} className="uppercase" data-testid="coupon-input" />
                      <Button variant="outline" onClick={applyCoupon} disabled={!couponInput || quoting} data-testid="coupon-apply">Aplicar</Button>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-extrabold uppercase"><CreditCard className="size-5 text-flame" /> Pagamento</h3>
                  <div className="rounded-md bg-card p-5 text-sm">
                    <p className="font-semibold">Cartão de crédito — até {inst.count}x de {inst.value} sem juros</p>
                    <p className="mt-2 flex items-start gap-2 text-muted-foreground">
                      <Lock className="mt-0.5 size-4 shrink-0" /> Você será redirecionado ao ambiente seguro do Stripe para inserir os dados do cartão. A VÉRTICE nunca armazena número de cartão ou CVV.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(0)}>Voltar</Button>
                  <Button size="lg" onClick={() => setStep(2)} data-testid="step2-next">Revisar pedido</Button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="s3" className="space-y-6">
                <h2 id="s3" className="font-display text-2xl font-extrabold uppercase">Revise seu pedido</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md bg-card p-5 text-sm">
                    <p className="mb-2 flex justify-between font-bold">Entrega <button className="text-xs underline" onClick={() => setStep(0)}>Alterar</button></p>
                    <p className="text-muted-foreground">{form.recipient}<br />{form.street}, {form.number}{form.complement && ` — ${form.complement}`}<br />{form.district}, {form.city}/{form.state}<br />CEP {form.zip}</p>
                  </div>
                  <div className="rounded-md bg-card p-5 text-sm">
                    <p className="mb-2 flex justify-between font-bold">Pagamento e frete <button className="text-xs underline" onClick={() => setStep(1)}>Alterar</button></p>
                    <p className="text-muted-foreground">Cartão via Stripe<br />{method === "EXPRESS" ? "Expresso (1-2 dias úteis)" : "Padrão (3-7 dias úteis)"}{coupon && <><br />Cupom {coupon}</>}</p>
                  </div>
                </div>
                {quote?.problems.length ? (
                  <div role="alert" className="rounded-md bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-300">{quote.problems.join(" · ")}. Ajuste seu carrinho.</div>
                ) : null}
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)}>Voltar</Button>
                  <Button variant="accent" size="lg" className="flex-1" onClick={placeOrder} disabled={placing || !quote || quote.problems.length > 0} data-testid="place-order">
                    <Lock /> {placing ? "Redirecionando…" : `Pagar ${quote ? formatBRL(quote.totalCents) : ""}`}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Ambiente de teste: use o cartão 4242 4242 4242 4242, qualquer data futura e qualquer CVC.</p>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Resumo */}
      <aside className="h-fit space-y-5 rounded-md bg-card p-6 lg:sticky lg:top-28" aria-label="Resumo do pedido">
        <h2 className="font-display text-lg font-extrabold uppercase">Resumo ({cart.count})</h2>
        <ul className="max-h-72 space-y-4 overflow-y-auto">
          {cart.items.map((i) => (
            <li key={i.id} className="flex gap-3 text-sm">
              <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded bg-stone2">
                {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                <span className="absolute -right-0 -top-0 flex size-5 items-center justify-center rounded-bl bg-ink text-[10px] font-bold text-paper">{i.quantity}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold leading-tight">{i.name}</p>
                <p className="text-xs text-muted-foreground">{[i.size && `Tam. ${i.size}`, i.color].filter(Boolean).join(" · ")}</p>
              </div>
              <p className="font-semibold">{formatBRL(i.unitPriceCents * i.quantity)}</p>
            </li>
          ))}
        </ul>
        {quote && <FreeShippingBar subtotalCents={quote.subtotalCents} missing={quote.missingForFreeShipping} />}
        <dl className={cn("space-y-2 border-t pt-4 text-sm", quoting && "opacity-60")} data-testid="checkout-totals">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(quote?.subtotalCents ?? cart.subtotalCents)}</dd></div>
          {!!quote?.discountCents && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex justify-between text-emerald-700 dark:text-emerald-400"><dt>Desconto ({coupon})</dt><dd data-testid="discount">−<AnimatedNumber value={quote.discountCents} money /></dd></motion.div>}
          <div className="flex justify-between"><dt>Frete</dt><dd>{quote ? (quote.shippingCents ? <AnimatedNumber value={quote.shippingCents} money /> : <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block font-semibold text-emerald-700 dark:text-emerald-400">Grátis</motion.span>) : "—"}</dd></div>
          <div className="flex justify-between border-t pt-3 text-lg font-bold"><dt>Total</dt><dd data-testid="total">{quote ? <AnimatedNumber value={quote.totalCents} money /> : "—"}</dd></div>
          <p className="text-right text-xs text-muted-foreground">ou {inst.count}x de {inst.value} sem juros</p>
        </dl>
        <Link href="/shop" className="block text-center text-xs font-semibold underline">Continuar comprando</Link>
      </aside>
    </div>
  );
}
