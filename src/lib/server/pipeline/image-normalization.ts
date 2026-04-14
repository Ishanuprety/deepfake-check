import sharp from "sharp";

export interface NormalizedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  channels: number;
  mean: number[];
  stdev: number[];
}

export async function normalizeImage(buffer: Buffer): Promise<NormalizedImage> {
  const normalizedBuffer = await sharp(buffer)
    .rotate()
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .toFormat("png")
    .toBuffer();

  const image = sharp(normalizedBuffer);
  const metadata = await image.metadata();
  const stats = await image.stats();

  return {
    buffer: normalizedBuffer,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format ?? "unknown",
    channels: metadata.channels ?? 0,
    mean: stats.channels.map((c) => c.mean),
    stdev: stats.channels.map((c) => c.stdev)
  };
}
