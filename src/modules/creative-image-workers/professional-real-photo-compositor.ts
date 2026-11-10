import sharp from "sharp";

export type ConfirmedPhotoOffer = {
  productName: string;
  kit: string;
  price: number;
  delivery: "consult" | "free";
  freeDeliveryRegion: string;
};

type Input = {
  referenceImageUrl: string;
  logoUrl: string;
  width: number;
  height: number;
  offer: ConfirmedPhotoOffer;
  framing: { top: number; bottom: number };
  direction: "auto" | "editorial" | "spotlight";
};

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function wrap(value: string, length: number, maxLines = 2): string[] {
  const rows: string[] = [];
  for (const word of value.trim().split(/\s+/).filter(Boolean)) {
    const last = rows.length - 1;
    if (last >= 0 && `${rows[last]} ${word}`.length <= length) {
      rows[last] += ` ${word}`;
    } else if (rows.length < maxLines) {
      rows.push(word);
    } else {
      rows[maxLines - 1] += "…";
      break;
    }
  }
  return rows;
}

async function fetchOfficialImage(urlValue: string): Promise<Buffer> {
  const url = new URL(urlValue);
  const allowed = new URL(process.env.SUPABASE_URL ?? "https://invalid.local");
  if (url.origin !== allowed.origin || url.username || url.password ||
      !url.pathname.startsWith("/storage/v1/object/public/")) {
    throw new Error("Foto ou logo fora do armazenamento oficial.");
  }
  const response = await fetch(url, {
    redirect: "error", signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error("A mídia aprovada não pôde ser carregada.");
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 100 || bytes.length > 15_000_000) {
    throw new Error("Mídia inválida ou maior que 15 MB.");
  }
  return bytes;
}

export async function composeProfessionalRealPhoto(input: Input): Promise<{
  buffer: Buffer;
  referenceBytes: number;
  layout: string;
}> {
  const { offer, width: w, height: h } = input;
  if (!offer.productName.trim() || !offer.kit.trim() ||
      !Number.isFinite(offer.price) || offer.price <= 0 ||
      !["consult", "free"].includes(offer.delivery) ||
      (offer.delivery === "free" && !offer.freeDeliveryRegion.trim())) {
    throw new Error("Produto, kit, preço ou condição de entrega não confirmados.");
  }
  if (![1080, 1200].includes(w) || ![1080, 1350, 1920, 628, 600].includes(h)) {
    throw new Error("Formato de anúncio não autorizado.");
  }
  if (!Number.isFinite(input.framing.top) || !Number.isFinite(input.framing.bottom) ||
      input.framing.top < 0 || input.framing.top > 0.4 ||
      input.framing.bottom < 0.6 || input.framing.bottom > 1 ||
      input.framing.top >= input.framing.bottom) {
    throw new Error("Enquadramento inválido.");
  }
  const [original, logo] = await Promise.all([
    fetchOfficialImage(input.referenceImageUrl),
    fetchOfficialImage(input.logoUrl)
  ]);
  const metadata = await sharp(original, { failOn: "warning" }).metadata();
  if (!metadata.width || !metadata.height ||
      metadata.width * metadata.height > 25_000_000) {
    throw new Error("Dimensões da foto inválidas.");
  }
  const oriented = await sharp(original).rotate().png().toBuffer();
  const image = await sharp(oriented).metadata();
  const sourceW = image.width!;
  const sourceH = image.height!;
  const top = Math.floor(sourceH * input.framing.top);
  const bottom = Math.floor(sourceH * input.framing.bottom);
  const cropped = await sharp(oriented).extract({
    left: 0, top, width: sourceW, height: bottom - top
  }).png().toBuffer();
  const horizontal = w > h;
  const tall = h >= 1900;
  const box = horizontal
    ? { x: 625, y: 72, w: 515, h: h - 144 }
    : tall
      ? { x: 65, y: 350, w: 950, h: 1040 }
      : h > w
        ? { x: 65, y: 300, w: 950, h: 615 }
        : { x: 65, y: 260, w: 950, h: 510 };
  const photo = await sharp(cropped).resize(box.w, box.h, {
    fit: "contain", background: "#ffffff"
  }).png().toBuffer();
  const logoSize = horizontal ? 95 : 116;
  const logoLayer = await sharp(logo).resize(logoSize, logoSize, {
    fit: "contain"
  }).png().toBuffer();
  const name = wrap(offer.productName.toUpperCase(), horizontal ? 19 : 28);
  const titleFont = horizontal ? 38 : 49;
  const titleX = horizontal ? 50 : 65;
  const titleY = horizontal ? 118 : 125;
  const title = name.map((line, index) =>
    `<text x="${titleX}" y="${titleY + index * 58}" font-size="${titleFont}" font-weight="800" fill="#14241c">${escapeXml(line)}</text>`
  ).join("");
  const kitY = titleY + name.length * 58 + (horizontal ? 12 : 9);
  const kitLines = wrap(offer.kit, horizontal ? 31 : 49);
  const kit = kitLines.map((line, index) =>
    `<text x="${titleX}" y="${kitY + index * 30}" font-size="${horizontal ? 19 : 23}" fill="#4c5e51">${escapeXml(line)}</text>`
  ).join("");
  const price = new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL"
  }).format(offer.price);
  const delivery = offer.delivery === "free"
    ? `Entrega grátis em ${offer.freeDeliveryRegion.trim()}`
    : "Consulte a entrega para seu bairro";
  const infoX = horizontal ? 50 : 65;
  const priceY = horizontal ? 335 : tall ? 1505 : h > w ? 1030 : 850;
  const deliveryY = priceY + (horizontal ? 44 : 56);
  const payY = deliveryY + 39;
  const buttonY = h - (horizontal ? 88 : tall ? 145 : 94);
  const buttonW = horizontal ? 505 : w - 130;
  const background = input.direction === "spotlight" ? "#eef1e9" : "#f8f5ed";
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${background}"/>
    <rect x="${titleX}" y="42" width="110" height="8" rx="4" fill="#f5c844"/>
    <rect x="${box.x - 8}" y="${box.y - 8}" width="${box.w + 16}" height="${box.h + 16}" rx="22" fill="#fff"/>
    <g font-family="DejaVu Sans, sans-serif">
      ${title}${kit}
      <text x="${infoX}" y="${priceY}" font-size="${horizontal ? 49 : 66}" font-weight="800" fill="#14241c">${escapeXml(price)}</text>
      <text x="${infoX}" y="${deliveryY}" font-size="${horizontal ? 17 : 22}" fill="#415449">${escapeXml(delivery.slice(0, horizontal ? 52 : 65))}</text>
      <text x="${infoX}" y="${payY}" font-size="${horizontal ? 18 : 23}" font-weight="700" fill="#20513a">Pague somente na entrega</text>
      <rect x="${infoX}" y="${buttonY}" width="${buttonW}" height="63" rx="18" fill="#126443"/>
      <text x="${infoX + 25}" y="${buttonY + 41}" font-size="${horizontal ? 22 : 27}" font-weight="800" fill="#fff">PEÇA PELO WHATSAPP</text>
    </g>
  </svg>`);
  const buffer = await sharp(svg).composite([
    { input: photo, left: box.x, top: box.y },
    { input: logoLayer, left: w - logoSize - 45, top: 32 }
  ]).webp({ quality: 92, effort: 5 }).toBuffer();
  return { buffer, referenceBytes: original.length,
    layout: `${input.direction}-${horizontal ? "horizontal" : tall ? "story" : "feed"}` };
}
