export type RealPhotoMedia = {
  id: string;
  source?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
};

export function isEligibleRealPhoto(media: RealPhotoMedia): boolean {
  const source = String(media.source ?? "").toLowerCase();
  const filename = String(media.file_name ?? "");
  const mime = String(media.mime_type ?? "").toLowerCase();

  // A procedência deve ser confirmada pelo operador; estes sinais só barram
  // arquivos claramente gerados ou importações de procedência desconhecida.
  return (source === "upload" || source === "google_drive") &&
    (!mime || mime.startsWith("image/")) &&
    !/(?:gemini[_ -]?generated|generated[_ -]?image|ai[_ -]?generated|premium[_ -]?scene)/i.test(filename);
}

export function requireSelectedRealPhoto(
  media: RealPhotoMedia | null | undefined,
  selectedMediaId: string | null
): RealPhotoMedia {
  if (!selectedMediaId || !media || media.id !== selectedMediaId || !isEligibleRealPhoto(media)) {
    const error = new Error("Selecione e confirme uma fotografia original do produto nesta campanha.") as Error & { code?: string };
    error.code = "CREATIVE_REAL_PHOTO_REQUIRED";
    throw error;
  }
  return media;
}
