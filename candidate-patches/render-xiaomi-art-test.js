"use strict";
const fs = require("node:fs");
const sharp = require("sharp");
const { composeProfessionalRealPhoto } = require(
  "../dist/modules/creative-image-workers/professional-real-photo-compositor.js"
);

const [backgroundPath, planPath, outputPath] = process.argv.slice(2);
if (!backgroundPath || !planPath || !outputPath) {
  throw new Error("Uso: node render-xiaomi-art-test.js FUNDO PLANO SAIDA");
}
const host = "qudpndluldjudukelwxd.supabase.co";
process.env.SUPABASE_URL = `https://${host}`;
const photo = `https://${host}/storage/v1/object/public/product-media/products/images/8c7c4486-f345-449b-807d-29e051842a4f-WhatsApp-Image-2026-10-28-at-19.01.50-3-.jpeg`;
const logo = `https://${host}/storage/v1/object/public/creative-assets/brands/logo-miranda-express.png.png`;

(async () => {
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const result = await composeProfessionalRealPhoto({
    referenceImageUrl: photo, logoUrl: logo,
    width: 1080, height: 1080,
    offer: {
      productName: "Carregador Xiaomi original  67W Charging Combo (Type-A) MDY-12-EZ.",
      kit: "Fonte USB-A, cabo e embalagem", price: 139.90,
      delivery: "consult", freeDeliveryRegion: ""
    },
    framing: { top: 0.10, bottom: 0.82 }, direction: "auto",
    backgroundBuffer: fs.readFileSync(backgroundPath),
    visualPlan: {
      layout: plan.layout, ink: plan.ink, accent: plan.accent,
      cutoutPolygon: [
        [.12,.28],[.33,.28],[.35,.19],[.68,.19],[.70,.28],
        [.94,.29],[.95,.77],[.85,.79],[.14,.79],[.10,.76]
      ]
    }
  });
  if (result.referenceBytes !== 89172) {
    throw new Error("A fotografia original mudou; prévia não gravada.");
  }
  const dimensions = await sharp(result.buffer).metadata();
  if (dimensions.width !== 1080 || dimensions.height !== 1080) {
    throw new Error("Dimensões inesperadas; prévia não gravada.");
  }
  fs.writeFileSync(outputPath, result.buffer, {flag:"wx", mode:0o600});
  console.log("ARTE_PILOTO=", outputPath);
  console.log("DIMENSOES=1080x1080");
  console.log("FOTO_ORIGINAL_BYTES=", result.referenceBytes);
  console.log("LAYOUT=", result.layout);
  console.log("PRODUCAO_INALTERADA=true");
})().catch(error => {
  console.error("TESTE_NAO_CONCLUIDO=", error.message);
  process.exitCode = 1;
});
