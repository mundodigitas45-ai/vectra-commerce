import test from "node:test";
import assert from "node:assert/strict";
import { isEligibleRealPhoto, requireSelectedRealPhoto } from "./real-photo-identity.ts";

test("foto real confirmada do produto passa; imagem de estúdio ou gerada importada não", () => {
  assert.equal(isEligibleRealPhoto({ id: "1", source: "google_drive", file_name: "WhatsApp Image.jpeg", mime_type: "image/jpeg" }), true);
  assert.equal(isEligibleRealPhoto({ id: "2", source: "ai_product_studio", file_name: "studio.webp", mime_type: "image/webp" }), false);
  assert.equal(isEligibleRealPhoto({ id: "3", source: "google_drive", file_name: "Gemini_Generated_Image.jfif", mime_type: "image/jpeg" }), false);
  assert.equal(isEligibleRealPhoto({ id: "4", source: "external", file_name: "produto.jpg", mime_type: "image/jpeg" }), false);
});

test("a foto da resposta do worker deve ser a mesma que o operador aprovou", () => {
  const photo = { id: "real-1", source: "upload", file_name: "produto.jpg", mime_type: "image/jpeg" };
  assert.equal(requireSelectedRealPhoto(photo, "real-1"), photo);
  assert.throws(() => requireSelectedRealPhoto(photo, "outro-id"), { code: "CREATIVE_REAL_PHOTO_REQUIRED" });
  assert.throws(() => requireSelectedRealPhoto(null, "real-1"), { code: "CREATIVE_REAL_PHOTO_REQUIRED" });
});
