import sharp from "sharp";

interface LockedCreativeInput {
  backgroundBuffer: Buffer;
  referenceImageUrl: string;
  width: number;
  height: number;
  content: Record<string, unknown>;
}

interface LockedCreativeResult {
  buffer: Buffer;
  referenceBytes: number;
  referenceHasAlpha: boolean;
  presentationMode: "transparent_product" | "protected_photo_card";
}

function domainError(code: string, message: string): Error & { code?: string } {
  const error = new Error(message) as Error & {
    code?: string;
  };

  error.code = code;
  return error;
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function linesFor(value: string, maximum: number): string[] {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);

  const lines: string[] = [];

  for (const word of words) {
    const index = Math.max(0, lines.length - 1);

    const candidate = lines.length ? `${lines[index]} ${word}` : word;

    if (candidate.length <= maximum || lines.length === 0) {
      if (lines.length === 0) {
        lines.push(candidate);
      } else {
        lines[index] = candidate;
      }
    } else if (lines.length < 3) {
      lines.push(word);
    }
  }

  return lines.slice(0, 3);
}

function textOverlay(
  width: number,
  height: number,
  content: Record<string, unknown>,
): Buffer {
  const headline =
    textValue(content.headline) || "Tecnologia para o seu dia a dia";

  const productName = textValue(content.product_name);

  const cta = textValue(content.cta) || "PEÇA PELO WHATSAPP";

  const rawPrice = Number(content.sale_price ?? content.price ?? 0);

  const price =
    Number.isFinite(rawPrice) && rawPrice > 0
      ? `R$ ${rawPrice.toFixed(2).replace(".", ",")}`
      : "";

  const margin = Math.round(width * 0.07);

  const logoSize = Math.round(Math.min(width, height) * 0.125);

  const logoLeft = width - margin - logoSize;

  const logoTop = Math.round(height * 0.045);

  const headlineFont = Math.round(
    Math.max(42, Math.min(64, width * 0.054)),
  );

  const headlineLineHeight = Math.round(headlineFont * 1.03);

  const headlineLines = linesFor(
    headline.toUpperCase(),
    width > 1100 ? 27 : 22,
  ).slice(0, 2);

  const headlineTop = margin + Math.round(height * 0.065);

  const headlineSpans = headlineLines
    .map(
      (line, index) =>
        `<tspan x="${margin}" dy="${
          index === 0 ? 0 : headlineLineHeight
        }">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const normalizedHeadline = headline
    .toLowerCase()
    .replace(/\s+/g, " ");

  const normalizedProduct = productName
    .toLowerCase()
    .replace(/\s+/g, " ");

  const showProductName =
    productName && normalizedHeadline !== normalizedProduct;

  const productFont = Math.round(
    Math.max(21, Math.min(29, width * 0.024)),
  );

  const productLines = showProductName
    ? linesFor(productName, width > 1100 ? 52 : 40).slice(0, 2)
    : [];

  const productLineHeight = Math.round(productFont * 1.18);

  const productTop =
    headlineTop +
    Math.max(0, headlineLines.length - 1) * headlineLineHeight +
    Math.round(height * 0.045);

  const productSpans = productLines
    .map(
      (line, index) =>
        `<tspan x="${margin + 20}" dy="${
          index === 0 ? 0 : productLineHeight
        }">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const productBadgeTop =
    productTop - productFont - Math.round(height * 0.009);

  const productBadgeHeight =
    productLines.length * productLineHeight +
    Math.round(height * 0.018);

  const productBadgeWidth = Math.min(
    width - margin * 2,
    Math.round(width * 0.75),
  );

  const buttonWidth = Math.round(width * 0.68);

  const buttonHeight = Math.round(
    Math.max(70, height * 0.06),
  );

  const buttonLeft = Math.round((width - buttonWidth) / 2);

  const buttonTop =
    height - buttonHeight - Math.round(height * 0.045);

  const priceFont = Math.round(
    Math.max(46, Math.min(70, width * 0.058)),
  );

  const priceCardWidth = Math.round(width * 0.38);

  const priceCardHeight = Math.round(height * 0.075);

  const priceCardLeft = Math.round(
    (width - priceCardWidth) / 2,
  );

  const priceCardTop =
    buttonTop - Math.round(height * 0.13);

  const priceBaseline =
    priceCardTop + Math.round(priceCardHeight * 0.7);

  const paymentWidth = Math.round(width * 0.47);

  const paymentHeight = Math.round(height * 0.038);

  const paymentLeft = Math.round(
    (width - paymentWidth) / 2,
  );

  const paymentTop =
    buttonTop - Math.round(height * 0.055);

  const paymentBaseline =
    paymentTop + Math.round(paymentHeight * 0.69);

  return Buffer.from(`
    <svg
      width="${width}"
      height="${height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#020202" stop-opacity="0.99"/>
          <stop offset="100%" stop-color="#050505" stop-opacity="0"/>
        </linearGradient>

        <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#050505" stop-opacity="0"/>
          <stop offset="100%" stop-color="#020202" stop-opacity="0.98"/>
        </linearGradient>

        <linearGradient id="goldButton" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffe493"/>
          <stop offset="48%" stop-color="#f3ca62"/>
          <stop offset="100%" stop-color="#d69b24"/>
        </linearGradient>

        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="${Math.round(height * 0.006)}"
            stdDeviation="${Math.round(height * 0.008)}"
            flood-color="#000000"
            flood-opacity="0.65"
          />
        </filter>
      </defs>

      <rect
        width="${width}"
        height="${Math.round(height * 0.34)}"
        fill="url(#topShade)"
      />

      <rect
        y="${Math.round(height * 0.69)}"
        width="${width}"
        height="${Math.round(height * 0.31)}"
        fill="url(#bottomShade)"
      />

      <rect
        x="${logoLeft - 7}"
        y="${logoTop - 7}"
        width="${logoSize + 14}"
        height="${logoSize + 14}"
        rx="${Math.round(logoSize * 0.16)}"
        fill="#050505"
        fill-opacity="0.96"
        stroke="#f3ca62"
        stroke-width="3"
        filter="url(#softShadow)"
      />

      <rect
        x="${margin}"
        y="${headlineTop - headlineFont - 18}"
        width="${Math.round(width * 0.09)}"
        height="6"
        rx="3"
        fill="#f3ca62"
      />

      <text
        x="${margin}"
        y="${headlineTop}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${headlineFont}"
        font-weight="900"
        letter-spacing="-1"
        fill="#ffffff"
        stroke="#050505"
        stroke-width="3"
        paint-order="stroke"
        filter="url(#softShadow)"
      >${headlineSpans}</text>

      ${
        productLines.length
          ? `
            <rect
              x="${margin}"
              y="${productBadgeTop}"
              width="${productBadgeWidth}"
              height="${productBadgeHeight}"
              rx="${Math.round(productBadgeHeight * 0.24)}"
              fill="#050505"
              fill-opacity="0.72"
              stroke="#f3ca62"
              stroke-opacity="0.6"
              stroke-width="2"
            />

            <text
              x="${margin + 20}"
              y="${productTop}"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${productFont}"
              font-weight="700"
              fill="#f3ca62"
            >${productSpans}</text>
          `
          : ""
      }

      ${
        price
          ? `
            <rect
              x="${priceCardLeft}"
              y="${priceCardTop}"
              width="${priceCardWidth}"
              height="${priceCardHeight}"
              rx="${Math.round(priceCardHeight / 2)}"
              fill="#050505"
              fill-opacity="0.88"
              stroke="#f3ca62"
              stroke-width="3"
              filter="url(#softShadow)"
            />

            <text
              x="${width / 2}"
              y="${priceBaseline}"
              text-anchor="middle"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${priceFont}"
              font-weight="900"
              letter-spacing="-1"
              fill="#ffffff"
            >${escapeXml(price)}</text>
          `
          : ""
      }

      <rect
        x="${paymentLeft}"
        y="${paymentTop}"
        width="${paymentWidth}"
        height="${paymentHeight}"
        rx="${Math.round(paymentHeight / 2)}"
        fill="#ffffff"
        fill-opacity="0.1"
        stroke="#f3ca62"
        stroke-opacity="0.72"
        stroke-width="2"
      />

      <text
        x="${width / 2}"
        y="${paymentBaseline}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${Math.round(Math.max(17, width * 0.019))}"
        font-weight="800"
        letter-spacing="0.5"
        fill="#ffffff"
      >PAGUE SOMENTE NA ENTREGA</text>

      <rect
        x="${buttonLeft}"
        y="${buttonTop}"
        width="${buttonWidth}"
        height="${buttonHeight}"
        rx="${Math.round(buttonHeight / 2)}"
        fill="url(#goldButton)"
        stroke="#ffe8a3"
        stroke-width="2"
        filter="url(#softShadow)"
      />

      <text
        x="${width / 2}"
        y="${buttonTop + buttonHeight * 0.66}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${Math.round(buttonHeight * 0.3)}"
        font-weight="900"
        letter-spacing="0.4"
        fill="#17120a"
      >${escapeXml(cta.slice(0, 38))}</text>
    </svg>
  `);
}

function allowedReferenceUrl(value: string): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw domainError(
      "CREATIVE_REFERENCE_IMAGE_INVALID",
      "A URL da foto real é inválida.",
    );
  }

  if (url.protocol !== "https:") {
    throw domainError(
      "CREATIVE_REFERENCE_IMAGE_INVALID",
      "A foto real precisa usar HTTPS.",
    );
  }

  if (process.env.SUPABASE_URL) {
    const allowedHost = new URL(process.env.SUPABASE_URL).hostname;

    if (url.hostname !== allowedHost) {
      throw domainError(
        "CREATIVE_REFERENCE_IMAGE_HOST_NOT_ALLOWED",
        "A foto precisa pertencer ao armazenamento oficial.",
      );
    }
  }

  return url;
}

async function downloadReference(value: string): Promise<Buffer> {
  const response = await fetch(allowedReferenceUrl(value), {
    signal: AbortSignal.timeout(20_000),
    headers: {
      Accept: "image/jpeg,image/png,image/webp",
    },
  });

  if (!response.ok) {
    throw domainError(
      "CREATIVE_REFERENCE_IMAGE_DOWNLOAD_FAILED",
      `A foto real retornou HTTP ${response.status}.`,
    );
  }

  const type = String(response.headers.get("content-type") ?? "").toLowerCase();

  if (!type.startsWith("image/")) {
    throw domainError(
      "CREATIVE_REFERENCE_IMAGE_INVALID",
      "O arquivo de referência não é uma imagem.",
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length < 100 || buffer.length > 15_000_000) {
    throw domainError(
      "CREATIVE_REFERENCE_IMAGE_INVALID",
      "A foto está vazia ou ultrapassa 15 MB.",
    );
  }

  return buffer;
}

export async function composeLockedCreative(
  input: LockedCreativeInput,
): Promise<LockedCreativeResult> {
  const referenceBuffer = await downloadReference(input.referenceImageUrl);

  const logoUrl = textValue(input.content.logo_url);

  const logoBuffer = logoUrl ? await downloadReference(logoUrl) : null;

  const referenceMetadata = await sharp(referenceBuffer, {
    failOn: "warning",
  }).metadata();

  const hasAlpha = referenceMetadata.hasAlpha === true;

  const background = await sharp(input.backgroundBuffer, {
    failOn: "warning",
  })
    .rotate()
    .resize(input.width, input.height, {
      fit: "cover",
      position: "centre",
    })
    .modulate({
      brightness: 0.82,
      saturation: 0.88,
    })
    .blur(0.3)
    .png()
    .toBuffer();

  const logoSize = Math.round(Math.min(input.width, input.height) * 0.125);

  const logoLayer = logoBuffer
    ? await sharp(logoBuffer, {
        failOn: "warning",
      })
        .rotate()
        .resize(logoSize, logoSize, {
          fit: "contain",
          withoutEnlargement: true,
        })
        .sharpen({ sigma: 0.8 })
        .png()
        .toBuffer()
    : null;

  const productWidth = Math.round(input.width * 0.76);

  const productHeight = Math.round(input.height * 0.48);

  let productLayer: Buffer;
  let presentationMode: "transparent_product" | "protected_photo_card";

  if (hasAlpha) {
    productLayer = await sharp(referenceBuffer, {
      failOn: "warning",
    })
      .rotate()
      .resize(productWidth, productHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    presentationMode = "transparent_product";
  } else {
    const radius = Math.round(Math.min(productWidth, productHeight) * 0.045);

    const mask = Buffer.from(`
      <svg
        width="${productWidth}"
        height="${productHeight}"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          width="${productWidth}"
          height="${productHeight}"
          rx="${radius}"
          fill="#ffffff"
        />
      </svg>
    `);

    productLayer = await sharp(referenceBuffer, {
      failOn: "warning",
    })
      .rotate()
      .resize(productWidth, productHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    presentationMode = "protected_photo_card";
  }

  const productMetadata = await sharp(productLayer).metadata();

  const actualWidth = productMetadata.width ?? productWidth;

  const actualHeight = productMetadata.height ?? productHeight;

  const left = Math.round((input.width - actualWidth) / 2);

  const availableBottom =
    input.height - actualHeight - Math.round(input.height * 0.17);

  const top = Math.max(
    Math.round(input.height * 0.29),
    Math.min(availableBottom, Math.round(input.height * 0.36)),
  );

  const output = await sharp(background)
    .composite([
      {
        input: productLayer,
        top,
        left,
      },
      {
        input: textOverlay(input.width, input.height, input.content),
        top: 0,
        left: 0,
      },
      ...(logoLayer
        ? [
            {
              input: logoLayer,
              top: Math.round(input.height * 0.045),
              left:
                input.width -
                logoSize -
                Math.round(input.width * 0.07),
            },
          ]
        : []),
    ])
    .webp({
      quality: 94,
      effort: 5,
    })
    .toBuffer();

  return {
    buffer: output,
    referenceBytes: referenceBuffer.length,
    referenceHasAlpha: hasAlpha,
    presentationMode,
  };
}
