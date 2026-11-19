import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const db = new PrismaClient();
const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;
const argon = (p: string) => hash(p, { algorithm: 2 /* Argon2id */, memoryCost: 19_456, timeCost: 2, parallelism: 1 });

const categories = [
  { slug: "calcados", name: "Calçados", description: "Performance e estilo para cada passo.", image: img("1556906781-9a412961c28c"), position: 1 },
  { slug: "vestuario", name: "Vestuário", description: "Peças essenciais com corte contemporâneo.", image: img("1512436991641-6745cdb1723f"), position: 2 },
  { slug: "tech", name: "Tech", description: "Tecnologia que acompanha seu ritmo.", image: img("1505740420928-5e560c06d30e"), position: 3 },
  { slug: "acessorios", name: "Acessórios", description: "Os detalhes que definem o look.", image: img("1524592094714-0f0654e20314"), position: 4 },
  { slug: "beleza", name: "Beleza", description: "Fragrâncias e cuidados autorais.", image: img("1615634260167-c8cdede054de"), position: 5 },
];

type SeedProduct = {
  slug: string; name: string; category: string; priceCents: number; compareAtCents?: number; rating: number; reviewCount: number;
  badge?: string; stock: number; sizes: string[]; colors: string[]; featured?: boolean; description: string; details: string[]; images: string[];
};

const products: SeedProduct[] = [
  {
    slug: "tenis-fluxo-runner", name: "Tênis Fluxo Runner", category: "calcados", priceCents: 64_990, compareAtCents: 79_990, rating: 4.9, reviewCount: 312,
    badge: "Mais vendido", stock: 42, sizes: ["37", "38", "39", "40", "41", "42", "43", "44"], colors: ["Preto", "Cinza Grafite"], featured: true,
    description: "O Fluxo Runner foi desenhado para quem vive a cidade em movimento. Entressola em espuma de alta resposta devolve energia a cada passada, enquanto o cabedal em knit respirável abraça o pé sem pressionar. Do treino de manhã ao rolê à noite, ele acompanha o seu ritmo com amortecimento leve e tração confiável no asfalto.",
    details: ["Cabedal em knit técnico respirável", "Entressola em espuma de alta resposta", "Solado em borracha com tração urbana", "Drop de 8mm — 265g (tam. 40)"],
    images: [img("1491553895911-0055eca6402d"), img("1517836357463-d25dfeac3438"), img("1556906781-9a412961c28c")],
  },
  {
    slug: "jaqueta-bomber-atlas", name: "Jaqueta Bomber Atlas", category: "vestuario", priceCents: 89_990, rating: 4.8, reviewCount: 187,
    badge: "Novo", stock: 25, sizes: ["P", "M", "G", "GG"], colors: ["Terracota", "Preto"], featured: true,
    description: "A Bomber Atlas reinterpreta um clássico com acabamento premium. Nylon acetinado com leve repelência à água, forro macio e punhos canelados que mantêm o caimento perfeito. Uma peça de transição que funciona das manhãs frias às noites na cidade.",
    details: ["Nylon acetinado com tratamento repelente à água", "Forro interno macio", "Bolso utilitário na manga", "Modelagem regular — veste fiel ao tamanho"],
    images: [img("1591047139829-d91aecb6caea"), img("1551028719-00167b16eac5")],
  },
  {
    slug: "fone-pulse-one", name: "Fone Pulse One", category: "tech", priceCents: 129_990, compareAtCents: 159_990, rating: 5.0, reviewCount: 98,
    badge: "Exclusivo", stock: 18, sizes: [], colors: ["Preto Fosco", "Grafite"], featured: true,
    description: "Pulse One entrega som de estúdio com cancelamento de ruído ativo adaptativo. Drivers de 40mm calibrados para graves profundos e médios cristalinos, até 40 horas de bateria e conforto para o dia inteiro com almofadas em espuma de memória.",
    details: ["Cancelamento de ruído ativo adaptativo", "Até 40h de bateria — carga rápida USB-C", "Bluetooth 5.3 multiponto", "Almofadas em espuma de memória"],
    images: [img("1505740420928-5e560c06d30e"), img("1583394838336-acd977736f90")],
  },
  {
    slug: "relogio-meridian-chrono", name: "Relógio Meridian Chrono", category: "acessorios", priceCents: 189_990, rating: 4.9, reviewCount: 76,
    badge: "Edição limitada", stock: 9, sizes: [], colors: ["Caramelo", "Preto"], featured: true,
    description: "Minimalismo com precisão. O Meridian Chrono combina caixa em aço inoxidável escovado de 40mm, vidro de safira resistente a riscos e pulseira em couro legítimo. Um relógio pensado para durar — e para ser notado nos detalhes.",
    details: ["Caixa em aço inox 316L — 40mm", "Vidro de safira antirrisco", "Resistência à água 5ATM", "Pulseira em couro legítimo com troca rápida"],
    images: [img("1524592094714-0f0654e20314")],
  },
  {
    slug: "oculos-noir-classic", name: "Óculos Noir Classic", category: "acessorios", priceCents: 45_990, rating: 4.7, reviewCount: 143,
    stock: 30, sizes: [], colors: ["Dourado/Verde", "Preto"],
    description: "Armação metálica ultraleve com lentes polarizadas e proteção UV400. O Noir Classic tem formato redondo atemporal, plaquetas ajustáveis e acabamento que combina com qualquer estilo — do alfaiataria ao streetwear.",
    details: ["Lentes polarizadas com proteção UV400", "Armação metálica ultraleve", "Plaquetas ajustáveis em silicone", "Acompanha estojo rígido e flanela"],
    images: [img("1511499767150-a48a237f0083")],
  },
  {
    slug: "mochila-urban-tech-25l", name: "Mochila Urban Tech 25L", category: "acessorios", priceCents: 54_990, compareAtCents: 64_990, rating: 4.8, reviewCount: 221,
    badge: "Oferta", stock: 35, sizes: [], colors: ["Azul Marinho", "Caramelo"], featured: true,
    description: "Organização inteligente para o dia a dia urbano. Compartimento acolchoado para notebook de até 16\", bolso antifurto nas costas, tecido resistente à água e alças ergonômicas que distribuem o peso. 25 litros de capacidade sem perder a silhueta limpa.",
    details: ["Compartimento acolchoado para notebook 16\"", "Bolso antifurto nas costas", "Tecido resistente à água", "Capacidade: 25 litros"],
    images: [img("1553062407-98eeb64c6a62"), img("1622560480605-d83c853bc5c3")],
  },
  {
    slug: "camiseta-essential-oversized", name: "Camiseta Essential Oversized", category: "vestuario", priceCents: 18_990, rating: 4.9, reviewCount: 534,
    stock: 120, sizes: ["P", "M", "G", "GG", "XGG"], colors: ["Branco", "Mescla", "Verde Musgo"],
    description: "A base de todo guarda-roupa. Algodão 100% penteado com fio 30.1, toque macio e gramatura encorpada de 200g/m². Modelagem oversized com ombro levemente caído, gola reforçada que não deforma e caimento impecável lavagem após lavagem.",
    details: ["100% algodão penteado fio 30.1", "Gramatura 200g/m²", "Modelagem oversized — ombro caído", "Gola canelada reforçada"],
    images: [img("1521572163474-6864f9cf17ab"), img("1564584217132-2271feaeb3c5"), img("1523381210434-271e8be1f52b")],
  },
  {
    slug: "perfume-ambar-n7", name: "Perfume Âmbar N°7", category: "beleza", priceCents: 38_990, rating: 4.8, reviewCount: 167,
    badge: "Novo", stock: 40, sizes: ["50ml", "100ml"], colors: [],
    description: "Âmbar N°7 é uma fragrância amadeirada-ambarada de assinatura marcante. Abre com bergamota e pimenta-rosa, revela um coração de íris e couro suave, e assenta em uma base quente de âmbar, baunilha e sândalo. Fixação prolongada, ideal para noites na cidade.",
    details: ["Família olfativa: amadeirada ambarada", "Topo: bergamota, pimenta-rosa", "Coração: íris, couro", "Fundo: âmbar, baunilha, sândalo"],
    images: [img("1588405748880-12d1d2a59f75"), img("1615634260167-c8cdede054de")],
  },
];

const sampleReviews = [
  { rating: 5, title: "Superou as expectativas", comment: "Qualidade impecável, chegou antes do prazo e o acabamento é premium de verdade." },
  { rating: 5, title: "Virou meu favorito", comment: "Uso quase todo dia. Confortável, bonito e combina com tudo. Já quero outra cor." },
  { rating: 4, title: "Muito bom", comment: "Produto excelente, só achei que poderia vir com uma embalagem mais sustentável." },
];

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@vertice.dev").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@Vertice2026";

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, name: "Admin VÉRTICE", role: "ADMIN", passwordHash: await argon(adminPassword), emailVerified: new Date() },
  });

  const reviewers = await Promise.all(
    [
      ["marina@exemplo.com", "Marina Costa"],
      ["rafael@exemplo.com", "Rafael Lima"],
      ["julia@exemplo.com", "Júlia Andrade"],
    ].map(([email, name]) => db.user.upsert({ where: { email }, update: {}, create: { email, name } })),
  );

  await db.user.upsert({
    where: { email: "cliente@vertice.dev" },
    update: {},
    create: { email: "cliente@vertice.dev", name: "Cliente Demo", passwordHash: await argon("Cliente@2026"), emailVerified: new Date() },
  });

  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  const catBySlug = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  for (const p of products) {
    const { images, category, ...data } = p;
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: { ...data, categoryId: catBySlug[category], compareAtCents: p.compareAtCents ?? null, badge: p.badge ?? null },
      create: { ...data, categoryId: catBySlug[category] },
    });
    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.createMany({
      data: images.map((url, i) => ({ productId: product.id, url, alt: `${p.name} — foto ${i + 1}`, position: i })),
    });
    for (const [i, r] of sampleReviews.entries()) {
      await db.review.upsert({
        where: { productId_userId: { productId: product.id, userId: reviewers[i].id } },
        update: {},
        create: { ...r, productId: product.id, userId: reviewers[i].id },
      });
    }
  }

  await db.coupon.upsert({
    where: { code: "VERTICE10" },
    update: { active: true },
    create: { code: "VERTICE10", type: "PERCENT", value: 10, minSubtotalCents: 0, active: true },
  });
  await db.coupon.upsert({
    where: { code: "BEMVINDO50" },
    update: {},
    create: { code: "BEMVINDO50", type: "FIXED", value: 5_000, minSubtotalCents: 30_000, maxUses: 100, active: true },
  });

  console.log(`Seed OK: ${products.length} produtos, ${categories.length} categorias, admin ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
