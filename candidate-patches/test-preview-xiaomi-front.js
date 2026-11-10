"use strict";
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const {
  composeProfessionalRealPhoto
} = require("../dist/modules/creative-image-workers/professional-real-photo-compositor.js");

const expectedHost = "qudpndluldjudukelwxd.supabase.co";
process.env.SUPABASE_URL = `https://${expectedHost}`;
const photo = `https://${expectedHost}/storage/v1/object/public/product-media/products/images/8c7c4486-f345-449b-807d-29e051842a4f-WhatsApp-Image-2026-10-28-at-19.01.50-3-.jpeg`;
const logo = `https://${expectedHost}/storage/v1/object/public/creative-assets/brands/logo-miranda-express.png.png`;
const output = path.resolve(__dirname, "../preview-xiaomi-67w-frente.webp");

(async () => {
  if (fs.existsSync(output)) throw new Error("Prévia já existe; não sobrescrever.");
  const result = await composeProfessionalRealPhoto({
    referenceImageUrl: photo,
    logoUrl: logo,
    width: 1080, height: 1080,
    offer: {
      productName: "Carregador Xiaomi original  67W Charging Combo (Type-A) MDY-12-EZ.",
      kit: "Fonte USB-A, cabo e embalagem",
      price: 139.90,
      delivery: "consult",
      freeDeliveryRegion: ""
    },
    framing: { top: 0.28, bottom: 0.79 },
    direction: "editorial"
  });
  if (result.referenceBytes !== 89172) {
    throw new Error("Foto diferente da frente aprovada; nada gravado.");
  }
  const dimensions = await sharp(result.buffer).metadata();
  if (dimensions.width !== 1080 || dimensions.height !== 1080) {
    throw new Error("Dimensões inválidas; nada gravado.");
  }
  fs.writeFileSync(output, result.buffer, { flag: "wx" });
  console.log("PREVIA_FRONTAL:", output);
  console.log("MIDIA_ID:", "d8d9b8b1-db94-4351-9ebc-b4517b808d8a");
  console.log("DIMENSOES:", `${dimensions.width}x${dimensions.height}`);
  console.log("FOTO_ORIGINAL_LIDA_BYTES:", result.referenceBytes);
  console.log("OPENAI_CHAMADA=false");
  console.log("PRODUCAO_INALTERADA=true");
})().catch(error => {
  console.error("TESTE_FALHOU:", error.message);
  process.exitCode = 1;
});
