import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { composeProfessionalRealPhoto } from "./professional-real-photo-compositor.ts";

test("renderiza os formatos a partir da mesma fotografia sem chamar um gerador", async () => {
  const photo = await sharp({
    create: { width: 600, height: 850, channels: 3, background: "#a8cde3" }
  }).jpeg().toBuffer();
  const logo = await sharp({
    create: { width: 128, height: 128, channels: 4, background: "#253b35" }
  }).png().toBuffer();
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const calls = [];
  process.env.SUPABASE_URL = "https://example.supabase.co";
  globalThis.fetch = async url => {
    calls.push(String(url));
    return new Response(String(url).endsWith("photo.jpg") ? photo : logo, {
      headers: { "content-type": String(url).endsWith("photo.jpg") ? "image/jpeg" : "image/png" }
    });
  };
  try {
    for (const [width, height] of [[1080, 1080], [1080, 1350], [1080, 1920], [1200, 628]]) {
      const output = await composeProfessionalRealPhoto({
        referenceImageUrl: "https://example.supabase.co/storage/v1/object/public/photos/photo.jpg",
        logoUrl: "https://example.supabase.co/storage/v1/object/public/logos/logo.png",
        width, height,
        offer: {
          productName: "Carregador Xiaomi 67W",
          kit: "Fonte, cabo e embalagem",
          price: 139.9, delivery: "consult", freeDeliveryRegion: ""
        },
        framing: { top: 0, bottom: 1 },
        direction: "auto"
      });
      const metadata = await sharp(output.buffer).metadata();
      assert.equal(metadata.width, width);
      assert.equal(metadata.height, height);
      assert.equal(output.referenceBytes, photo.length);
      assert.ok(output.buffer.length > 10_000);
    }
    assert.equal(calls.length, 8);
    assert.ok(calls.every(url => url.startsWith("https://example.supabase.co/storage/v1/object/public/")));
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
  }
});

test("recusa mídia fora do storage oficial e entrega grátis sem região", async () => {
  const input = {
    referenceImageUrl: "https://outside.invalid/photo.jpg",
    logoUrl: "https://outside.invalid/logo.png",
    width: 1080, height: 1080,
    offer: {
      productName: "Produto", kit: "Kit", price: 49.9,
      delivery: "free", freeDeliveryRegion: ""
    },
    framing: { top: 0, bottom: 1 }, direction: "auto"
  };
  await assert.rejects(() => composeProfessionalRealPhoto(input), /região|confirmados/i);
  const previousUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = "https://example.supabase.co";
  try {
    await assert.rejects(() => composeProfessionalRealPhoto({
      ...input, offer: { ...input.offer, delivery: "consult" }
    }), /armazenamento oficial/);
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
  }
});
