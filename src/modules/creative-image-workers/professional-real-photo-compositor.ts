import sharp from "sharp";

export type ConfirmedPhotoOffer = {
  productName: string;
  kit: string;
  price: number;
  delivery: "consult" | "free";
  freeDeliveryRegion: string;
};

// A direção visual pode mudar a composição, nunca os fatos comerciais.
export type CreativeVisualPlan = {
  layout: "hero_center" | "hero_left" | "hero_right";
  ink: "dark" | "light";
  accent: "yellow" | "green";
  // Coordenadas normalizadas na fotografia original. A máscara afeta somente
  // o alfa; todos os pixels do produto vêm da foto, sem recriação por IA.
  cutoutPolygon?: [number, number][];
};

type Input = {
  referenceImageUrl: string;
  logoUrl: string;
  width: number;
  height: number;
  offer: ConfirmedPhotoOffer;
  framing: { top: number; bottom: number };
  direction: "auto" | "editorial" | "spotlight";
  backgroundBuffer?: Buffer;
  visualPlan?: CreativeVisualPlan;
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
  let cropped = await sharp(oriented).extract({
    left: 0, top, width: sourceW, height: bottom - top
  }).png().toBuffer();
  const polygon = input.visualPlan?.cutoutPolygon;
  if (polygon) {
    if (polygon.length < 3 || polygon.length > 32 ||
        polygon.some(point => !Array.isArray(point) || point.length !== 2 ||
          point.some(value => !Number.isFinite(value) || value < 0 || value > 1))) {
      throw new Error("Máscara de recorte inválida.");
    }
    const points = polygon.map(([x, y]) =>
      `${Math.round(x * sourceW)},${Math.round(y * sourceH - top)}`
    ).join(" ");
    const alpha = Buffer.from(`<svg width="${sourceW}" height="${bottom - top}">
      <polygon points="${points}" fill="white"/>
    </svg>`);
    cropped = await sharp(cropped).ensureAlpha()
      .composite([{ input: alpha, blend: "dest-in" }]).png().toBuffer();
  }
  const horizontal = w > h;
  const tall = h >= 1900;
  const plannedLayout = input.visualPlan?.layout ?? "hero_center";
  if (!["hero_center", "hero_left", "hero_right"].includes(plannedLayout)) {
    throw new Error("Direção visual inválida.");
  }
  const sideLayout = !horizontal && plannedLayout !== "hero_center" && !tall;
  const box = sideLayout
    ? { x: plannedLayout === "hero_left" ? 45 : 490,
        y: h > w ? 325 : 285, w: 545, h: h > w ? 595 : 495 }
    : horizontal
    ? { x: 625, y: 72, w: 515, h: h - 144 }
    : tall
      ? { x: 65, y: 350, w: 950, h: 1040 }
      : h > w
        ? { x: 65, y: 300, w: 950, h: 615 }
        : { x: 65, y: 245, w: 950, h: 575 };
  const photo = await sharp(cropped).resize(box.w, box.h, {
    fit: "contain", background: polygon ? "#00000000" : "#ffffff"
  }).png().toBuffer();
  const logoSize = horizontal ? 95 : 116;
  const logoLayer = await sharp(logo).resize(logoSize, logoSize, {
    fit: "contain"
  }).png().toBuffer();
  const name = wrap(offer.productName.toUpperCase(), horizontal ? 19 : 25,
    horizontal ? 2 : 3);
  const titleFont = horizontal ? 38 : name.length === 3 ? 35 : 45;
  const titleX = horizontal ? 50 : 65;
  const titleY = horizontal ? 118 : name.length === 3 ? 92 : 120;
  const title = name.map((line, index) =>
    `<text x="${titleX}" y="${titleY + index * (titleFont + 8)}" font-size="${titleFont}" font-weight="800" fill="#14241c">${escapeXml(line)}</text>`
  ).join("");
  const kitY = titleY + name.length * (titleFont + 8) + (horizontal ? 12 : 9);
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
  let generatedBackground: Buffer | null = null;
  if (input.backgroundBuffer) {
    if (input.backgroundBuffer.length > 20_000_000) {
      throw new Error("Fundo maior que 20 MB.");
    }
    const info = await sharp(input.backgroundBuffer, { failOn: "warning" }).metadata();
    if (!info.width || !info.height || info.width * info.height > 25_000_000) {
      throw new Error("Fundo visual inválido.");
    }
    generatedBackground = await sharp(input.backgroundBuffer).rotate()
      .resize(w, h, { fit: "cover" }).png().toBuffer();
  }
  // A direção da IA é uma sugestão. Os textos comerciais têm tinta escura;
  // caso o cenário gerado fique escuro, só a área de leitura ganha base clara.
  const ink = generatedBackground ? "#14241c"
    : input.visualPlan?.ink === "light" ? "#ffffff" : "#14241c";
  const secondaryInk = generatedBackground ? "#415449"
    : input.visualPlan?.ink === "light" ? "#f1f5f1" : "#415449";
  const accent = generatedBackground ? "#f5c844"
    : input.visualPlan?.accent === "green" ? "#126443" : "#f5c844";
  const titlePanel = { x: horizontal ? 28 : 38, y: horizontal ? 22 : 20,
    w: horizontal ? 570 : w - 76, h: horizontal ? 235 : 244 };
  const infoPanel = { x: horizontal ? 28 : 38,
    y: horizontal ? 282 : tall ? 1420 : h > w ? 955 : 785,
    w: horizontal ? 570 : w - 76,
    h: horizontal ? h - 300 : tall ? 375 : h > w ? 365 : 275 };
  const darkFraction = async (panel: typeof titlePanel): Promise<number> => {
    if (!generatedBackground) return 0;
    const pixels = await sharp(generatedBackground).extract({
      left: panel.x, top: panel.y, width: panel.w, height: panel.h
    }).resize(32, 8).greyscale().raw().toBuffer();
    return [...pixels].filter(value => value < 155).length / pixels.length;
  };
  const contrastPanels = (await Promise.all([titlePanel, infoPanel].map(async panel =>
    (await darkFraction(panel)) > 0.08
      ? `<rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}"
          rx="26" fill="#faf7ef" fill-opacity="0.95"/>`
      : ""
  ))).join("");
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${generatedBackground ? "transparent" : background}"/>
    ${contrastPanels}
    <rect x="${titleX}" y="42" width="110" height="8" rx="4" fill="${accent}"/>
    ${polygon ? "" : `<rect x="${box.x - 8}" y="${box.y - 8}" width="${box.w + 16}" height="${box.h + 16}" rx="22" fill="#fff"/>`}
    <g font-family="DejaVu Sans, sans-serif">
      ${title.replaceAll('fill="#14241c"', `fill="${ink}"`)}${kit.replaceAll('fill="#4c5e51"', `fill="${secondaryInk}"`)}
      <text x="${infoX}" y="${priceY}" font-size="${horizontal ? 49 : 66}" font-weight="800" fill="${ink}">${escapeXml(price)}</text>
      <text x="${infoX}" y="${deliveryY}" font-size="${horizontal ? 17 : 22}" fill="${secondaryInk}">${escapeXml(delivery.slice(0, horizontal ? 52 : 65))}</text>
      <text x="${infoX}" y="${payY}" font-size="${horizontal ? 18 : 23}" font-weight="700" fill="${secondaryInk}">Pague somente na entrega</text>
      <rect x="${infoX}" y="${buttonY}" width="${buttonW}" height="63" rx="18" fill="#126443"/>
      <text x="${infoX + 25}" y="${buttonY + 41}" font-size="${horizontal ? 22 : 27}" font-weight="800" fill="#fff">PEÇA PELO WHATSAPP</text>
    </g>
  </svg>`);
  const base = generatedBackground ?? await sharp({
    create: { width: w, height: h, channels: 4, background }
  }).png().toBuffer();
  const buffer = await sharp(base).composite([
    { input: svg, left: 0, top: 0 },
    { input: photo, left: box.x, top: box.y },
    { input: logoLayer, left: w - logoSize - 45, top: 32 }
  ]).webp({ quality: 92, effort: 5 }).toBuffer();
  return { buffer, referenceBytes: original.length,
    layout: `${plannedLayout}-${horizontal ? "horizontal" : tall ? "story" : "feed"}` };
}
