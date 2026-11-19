<div align="center">

# VÉRTICE<span>.</span>

### Vista a cidade. Viva o movimento.

E-commerce full-stack de moda, calçados, tech e acessórios — construído do zero com padrões de produção:
**checkout real com Stripe, autenticação segura, painel admin, modo escuro e micro-interações.**

![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma) ![Stripe](https://img.shields.io/badge/Stripe-Checkout-635BFF?logo=stripe&logoColor=white) ![Auth.js](https://img.shields.io/badge/Auth.js-v5-7C3AED) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?logo=framer&logoColor=white) ![Tests](https://img.shields.io/badge/testes-25_unit_%2B_11_e2e-22c55e) ![npm audit](https://img.shields.io/badge/npm_audit-0_vulnerabilidades-22c55e)

![VÉRTICE — hero no modo escuro](docs/screenshots/01-hero-dark.jpg)

</div>

---

## ✨ Destaques

- 🛍️ **Loja completa** — catálogo com busca ao vivo, filtros e ordenação, compra rápida em modal, galeria, variações de tamanho/cor e estoque real.
- 💳 **Checkout em 3 passos** — endereço com autopreenchimento por CEP (ViaCEP), frete grátis acima de R$ 399, cupom `VERTICE10`, pagamento via **Stripe Checkout** e webhooks assinados.
- 🔐 **Segurança de verdade** — Argon2id, bloqueio após 5 tentativas, 2FA (TOTP), rate limiting, CSP com nonce, proteção contra CSRF e IDOR, preços sempre recalculados no servidor.
- 📦 **Pós-venda** — "Meus pedidos", histórico de status, rastreio e e-mails transacionais (Resend).
- 📊 **Painel admin** — dashboard com gráficos, CRUD de produtos com upload, estoque, pedidos e cupons.
- 🌗 **Modo claro/escuro/sistema** — troca com revelação circular (View Transitions API) e sem flash no carregamento.
- 🎞️ **Micro-interações** — produto que "voa" até o carrinho, tilt 3D, spotlight, botões magnéticos, títulos que se montam, faixa cinética, números animados e confete.

## 📸 Telas

| Claro | Escuro |
|---|---|
| ![Hero claro](docs/screenshots/01-hero-light.jpg) | ![Categorias](docs/screenshots/02-categorias-dark.jpg) |
| ![Catálogo com filtros](docs/screenshots/04-catalogo.jpg) | ![Destaques](docs/screenshots/03-destaques-dark.jpg) |
| ![Compra rápida](docs/screenshots/05-quick-view.jpg) | ![Checkout com cupom](docs/screenshots/08-checkout-cupom.jpg) |
| ![Página de produto](docs/screenshots/06-produto.jpg) | ![Pedido confirmado](docs/screenshots/09-pedido-confirmado.jpg) |
| ![Carrinho](docs/screenshots/07-carrinho.jpg) | ![Rastreio do pedido](docs/screenshots/10-rastreio.jpg) |

### Painel administrativo

| Dashboard | Produtos |
|---|---|
| ![Dashboard admin](docs/screenshots/11-admin-dashboard.jpg) | ![Produtos admin](docs/screenshots/12-admin-produtos.jpg) |

### Mobile

<p align="center"><img src="docs/screenshots/13-mobile.jpg" alt="VÉRTICE no celular" width="640" /></p>

## 🧰 Stack

**Frontend:** Next.js 15 (App Router, Server Components, Server Actions) · TypeScript · Tailwind CSS · componentes no estilo shadcn/ui (Radix UI) · Framer Motion · canvas-confetti
**Backend:** Server Actions + Route Handlers · PostgreSQL · Prisma ORM · Auth.js v5 (Prisma Adapter) · Zod
**Serviços:** Stripe (Checkout + Webhooks) · Resend · Upstash Redis · Cloudinary
**Qualidade:** Vitest · Playwright · ESLint · `npm audit`

## 🎞️ Reatividade e micro-interações

Os efeitos seguem a mesma arquitetura do meu portfólio: um único módulo em JavaScript puro (`lib/effects.ts`) cuida dos efeitos por meio de atributos `data-*`, delegados no `document`. Ele atualiza no máximo uma vez por frame (`requestAnimationFrame`) e não causa re-render no React.

| Técnica | Onde aparece |
|---|---|
| `data-reveal` + IntersectionObserver (fade-up com blur) | títulos de seção, categorias, depoimentos, KPIs do admin |
| Títulos que se montam palavra a palavra e letra a letra | hero e cabeçalhos de seção |
| `data-scramble` — texto que "decodifica" | pequenos títulos acima das seções |
| `data-tilt` + `data-spotlight` (tilt 3D e brilho que segue o cursor) | cards de produto, categorias e depoimentos |
| `data-magnetic` — botões magnéticos | CTAs e "Adicionar ao carrinho" |
| `data-parallax`, Ken Burns e brasas em CSS | hero e editorial |
| Borda luminosa com `@property --angle` | cards e botão de finalizar compra |
| `layoutId` (Framer Motion) — pílula que desliza | menu, filtros, menus da conta e do admin |
| Web Animations API — produto que voa até o carrinho | compra rápida e página de produto |
| Números animados (`animate` do Framer Motion) | subtotal, total, desconto, frete e KPIs |
| `canvas-confetti` sem Web Worker (compatível com a CSP) | cupom aplicado e pedido confirmado |
| View Transitions API — troca de tema com revelação circular | botão de tema |

Tudo respeita `prefers-reduced-motion`, e os efeitos de cursor só são ativados em dispositivos com mouse.

---

## 1. Rodando localmente

Requisitos: **Node 20+** e um PostgreSQL (local, Docker, Neon ou Supabase).

```bash
npm install
cp .env.example .env          # Prisma CLI e Next.js leem .env
```

Gere os segredos e cole no `.env`:

```bash
openssl rand -base64 32       # → AUTH_SECRET
openssl rand -base64 32       # → ENCRYPTION_KEY (cifra os segredos de 2FA)
```

### Banco de dados

**Opção A — Postgres local sem Docker (Prisma Dev):**
```bash
npx prisma dev --name vertice --detach
# copie a URL "TCP" exibida para DATABASE_URL e adicione:
#   &connection_limit=1&pgbouncer=true
```

**Opção B — Docker:**
```bash
docker run -d --name vertice-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=vertice -p 5432:5432 postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vertice"
```

**Opção C — Neon / Supabase:** crie o banco e use a connection string com `?sslmode=require`.

### Migrations + seed

```bash
npx prisma migrate deploy     # cria as tabelas
npm run db:seed               # 8 produtos, 5 categorias, cupons e usuários demo
npm run dev                   # http://localhost:3000
```

### Usuários do seed

| Papel | Email | Senha |
|---|---|---|
| Admin | `admin@vertice.dev` | `Admin@Vertice2026` (altere via `SEED_ADMIN_PASSWORD`) |
| Cliente | `cliente@vertice.dev` | `Cliente@2026` |

Cupons: `VERTICE10` (10% OFF) e `BEMVINDO50` (R$ 50 OFF acima de R$ 300, 100 usos).

---

## 2. Variáveis de ambiente

Veja `.env.example` (sem valores reais). **Nunca commite `.env`** — ele já está no `.gitignore`.

| Variável | Obrigatória | Para quê |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL. Em produção: usuário com permissão mínima + `sslmode=require` |
| `AUTH_SECRET` | ✅ | Assina/criptografa o JWT de sessão |
| `ENCRYPTION_KEY` | ✅ | AES-256-GCM dos segredos TOTP (32 bytes base64) |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública (links de email, Stripe, CORS, sitemap) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | prod | Pagamentos. **Sem a chave, em dev, o app usa pagamento simulado** |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | opcional | Login com Google (o botão só aparece se configurado) |
| `RESEND_API_KEY` / `EMAIL_FROM` | opcional | Emails. Sem a chave, os envios são só registrados no log (mascarados) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | prod | Rate limit distribuído. Sem eles: limitador em memória (só para dev) |
| `CLOUDINARY_*` | opcional | Upload de imagens no admin |

---

## 3. Testando o Stripe (modo teste)

1. Crie uma conta em https://dashboard.stripe.com e copie a **Secret key de teste** (`sk_test_...`) para `STRIPE_SECRET_KEY`.
2. Instale a Stripe CLI e encaminhe os webhooks:
   ```bash
   stripe login
   npm run stripe:listen       # mostra o whsec_... → STRIPE_WEBHOOK_SECRET
   ```
3. Reinicie `npm run dev` e faça uma compra:
   - Cartão: **4242 4242 4242 4242** · validade futura (ex.: 12/34) · CVC qualquer · CEP qualquer
   - Recusado: `4000 0000 0000 0002` · 3-D Secure: `4000 0025 0000 3155`
4. O webhook `checkout.session.completed` marca o pedido como **PAGO**, limpa o carrinho e envia o email de confirmação. Se a sessão expirar (`checkout.session.expired`) o pedido é cancelado e o estoque devolvido.

> Sem `STRIPE_SECRET_KEY` (apenas em desenvolvimento) o checkout redireciona para `/checkout/simulado`, que confirma o pagamento sem Stripe. Essa rota retorna 404 em produção.

### Roteiro de teste manual
1. `/cadastro` → crie uma conta (senha: 8+ caracteres com maiúscula, minúscula e número)
2. Abra um produto, escolha tamanho/cor → **Adicionar ao carrinho** (o drawer mostra "Falta R$ X para frete grátis")
3. **Finalizar compra** → Dados (CEP preenche o endereço via ViaCEP) → Pagamento → aplique **VERTICE10** → Revisão → **Pagar**
4. Pague com **4242 4242 4242 4242** → página de confirmação → **Minha conta › Pedidos** mostra o rastreio
5. Entre como admin → `/admin` → marque o pedido como **Enviado** e depois **Entregue** e acompanhe o rastreio do cliente

---

## 4. Testes

```bash
npm test                      # Vitest — 25 testes unitários (preços, cupons, Zod, Argon2, upload, logs)
npx playwright install chromium
npm run test:e2e              # Playwright — 11 cenários (sobe `next dev` sozinho)
E2E_PORT=3100 npm run test:e2e  # usar outra porta / servidor já rodando
npm run typecheck && npm run lint
```

Os E2E cobrem: home, busca ao vivo e ordenação, quick view, 404, modo escuro (alternar e persistir), fluxo completo de compra com VERTICE10, proteção de rotas, bloqueio do `/admin` para não-admin, **IDOR** (cliente B não vê pedido de A), **bloqueio após 5 tentativas de login** e acesso do admin.

---

## 5. Deploy

> ⚠️ A VÉRTICE é um app **full-stack**: usa banco de dados, autenticação, Server Actions e webhooks. Por isso ela precisa de um servidor Node. O **Netlify Drop** (arrastar uma pasta) só publica sites estáticos e **não serve** para este projeto. O deploy é feito conectando o repositório do GitHub.

### Netlify (via GitHub)

1. Crie o banco no [Neon](https://neon.tech) (grátis) e copie a connection string com `?sslmode=require`.
2. No Netlify: **Add new site → Import an existing project → GitHub** → selecione este repositório. O `netlify.toml` já define o build (`prisma migrate deploy && npm run build`) e o runtime de Next.js é detectado automaticamente.
3. Em **Site configuration → Environment variables**, cadastre as variáveis do `.env.example`, no mínimo: `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_APP_URL=https://lojavertice.netlify.app` e `AUTH_TRUST_HOST=true`.
4. Para ter produtos na loja, rode o seed **uma vez** a partir da sua máquina, apontando para o Neon, **com uma senha de admin própria** (a senha padrão está publicada neste README):
   `DATABASE_URL="..." SEED_ADMIN_EMAIL="voce@email.com" SEED_ADMIN_PASSWORD="SuaSenhaForte!26" npm run db:seed`
5. Pagamentos: em produção, o pagamento simulado fica **desativado**. Configure `STRIPE_SECRET_KEY` (modo teste) e o webhook `https://lojavertice.netlify.app/api/webhooks/stripe`.

### Vercel + Neon

1. Crie o banco no Neon (região `sa-east-1`) e um **usuário da aplicação com permissão mínima**:
   ```sql
   CREATE ROLE vertice_app LOGIN PASSWORD '...';
   GRANT CONNECT ON DATABASE vertice TO vertice_app;
   GRANT USAGE ON SCHEMA public TO vertice_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vertice_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vertice_app;
   ```
   Rode `prisma migrate deploy` com o usuário **owner**; a aplicação usa `vertice_app`. Backups: o Neon tem point-in-time restore (ajuste a janela de retenção no plano); no Supabase ative os backups diários.
2. Importe o repositório na Vercel e configure as variáveis (todas do `.env.example`).
3. Build command: `prisma migrate deploy && npm run build`.
4. No Stripe Dashboard → Webhooks → endpoint `https://SEU-DOMINIO/api/webhooks/stripe` com os eventos `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
5. Google OAuth: redirect URI `https://SEU-DOMINIO/api/auth/callback/google`.

---

## 6. Arquitetura

```
app/            rotas (App Router): loja, conta, checkout, admin, api
actions/        Server Actions (auth, carrinho, checkout, favoritos, admin…) — todas validadas com Zod
components/     UI (components/ui = primitivas estilo shadcn/ui)
components/fx/ efeitos visuais (Reveal, SplitWords, KineticBand, AnimatedNumber, confete…)
lib/            regras de negócio e segurança (pricing, orders, cart, rate-limit, crypto, email, effects…)
prisma/         schema, migrations e seed
types/          augmentations de tipos (Auth.js)
tests/          unit (Vitest) e e2e (Playwright)
middleware.ts   rate limit global, CSRF (Origin), proteção de rotas, CSP com nonce
auth.ts         Auth.js: Credentials (Argon2id + lockout + 2FA) + Google
```

### Segurança implementada
- **Senhas:** Argon2id (parâmetros OWASP). Comparação em tempo constante para usuário inexistente (anti-enumeração).
- **Sessão:** JWT em cookie `httpOnly` + `SameSite=Lax` + `Secure` (HTTPS). Sessão de 7 dias; a cada **15 min** o token é revalidado no banco (role, bloqueio, `tokenVersion`) e o identificador é **rotacionado**. Trocar/redefinir a senha invalida todas as sessões.
- **Força bruta:** 5 falhas → conta bloqueada por 15 min; rate limit de 5/min em login (por IP e por email).
- **2FA TOTP** opcional (recomendado ao admin), segredo cifrado com AES-256-GCM.
- **Recuperação de senha:** token aleatório de 256 bits, salvo apenas como SHA-256, expira em 1h, uso único garantido por update condicional; resposta idêntica exista ou não o email.
- **Rate limiting (Upstash):** 100 req/min por IP (geral), 5/min login, 10/min checkout.
- **CSRF:** Server Actions validam Origin (Next.js); rotas `/api` mutáveis exigem Origin do próprio app; Auth.js usa token CSRF próprio; `SameSite=Lax`.
- **XSS:** React escapa tudo; nenhum `dangerouslySetInnerHTML` com dados de usuário (regra de lint `react/no-danger`; a única exceção é o JSON-LD gerado no servidor com `<` escapado); emails escapam HTML.
- **Headers:** CSP com nonce por requisição + `strict-dynamic`, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, COOP. `poweredByHeader: false`, `reactStrictMode`.
- **IDOR:** o id do usuário vem SEMPRE da sessão; consultas filtram por `userId` (ou role ADMIN conferida no banco); recursos de terceiros retornam 404.
- **Pagamentos:** apenas Stripe Checkout; preços, frete, cupom e total recalculados no servidor a partir do banco; webhook com `stripe.webhooks.constructEvent` + conferência do valor pago. Nenhum dado de cartão toca o servidor.
- **Estoque:** decremento atômico e condicional (`stock >= qty`) dentro de `prisma.$transaction` — sem overselling. Cupom com limite de uso também é reservado de forma condicional.
- **Uploads:** só admin, tipo validado por magic bytes (JPG/PNG/WEBP/AVIF; SVG/HTML rejeitados), máx. 5MB, renomeado com UUID, servido pelo CDN do Cloudinary.
- **Dados:** preços em centavos (Int), soft delete de produtos, pedidos nunca são deletados (`onDelete: Restrict`) e possuem histórico de status.
- **Logs:** JSON estruturado com mascaramento de email/CPF/cartão e remoção de campos sensíveis.
- **Dependências:** `npm audit` → 0 vulnerabilidades no momento da entrega.

---

## 7. Rotas

**Páginas:** `/` · `/shop` · `/produto/[slug]` · `/lookbook` · `/ajuda` · `/favoritos` · `/login` · `/cadastro` · `/esqueci-senha` · `/redefinir-senha` · `/checkout` · `/checkout/sucesso` · `/checkout/simulado` (só dev) · `/conta` · `/conta/pedidos` · `/conta/pedidos/[number]` · `/conta/enderecos` · `/conta/favoritos` · `/conta/seguranca` · `/admin` · `/admin/produtos` · `/admin/produtos/novo` · `/admin/produtos/[id]` · `/admin/pedidos` · `/admin/pedidos/[id]` · `/admin/cupons` · `/sitemap.xml` · `/robots.txt`

**API:** `GET|POST /api/auth/*` (Auth.js) · `POST /api/webhooks/stripe` · `POST /api/upload` (admin) · `GET /api/products` (catálogo público com filtros) · `GET /api/health`

**Server Actions:** `actions/auth.ts` (login, cadastro, Google, logout, esqueci/redefinir/trocar senha, 2FA) · `actions/cart.ts` · `actions/wishlist.ts` · `actions/checkout.ts` (cotação, pedido, cancelamento) · `actions/account.ts` (perfil, endereços) · `actions/store.ts` (busca, avaliações, newsletter) · `actions/admin.ts` (produtos, estoque, cupons, status de pedidos)
