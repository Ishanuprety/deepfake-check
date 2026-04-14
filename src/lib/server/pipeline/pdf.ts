import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";
import type { CandidateImage } from "@/lib/server/pipeline/types";

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return pdfjs;
}

function toRgbBuffer(
  input: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): Buffer {
  if (input.length === width * height * 3) {
    return Buffer.from(input);
  }
  if (input.length === width * height * 4) {
    const rgb = Buffer.alloc(width * height * 3);
    for (let i = 0, j = 0; i < input.length; i += 4, j += 3) {
      rgb[j] = input[i];
      rgb[j + 1] = input[i + 1];
      rgb[j + 2] = input[i + 2];
    }
    return rgb;
  }
  return Buffer.alloc(0);
}

async function extractInlineImages(page: any, fileName: string): Promise<CandidateImage[]> {
  const pdfjs = await loadPdfJs();
  const opList = await page.getOperatorList();
  const images: CandidateImage[] = [];
  let inlineIndex = 0;

  for (let i = 0; i < opList.fnArray.length; i += 1) {
    if (opList.fnArray[i] !== pdfjs.OPS.paintInlineImageXObject) continue;
    const arg = opList.argsArray[i]?.[0];
    if (!arg || !arg.width || !arg.height || !arg.data) continue;

    const raw = toRgbBuffer(arg.data, arg.width, arg.height);
    if (raw.length === 0) continue;

    const pngBuffer = await sharp(raw, {
      raw: { width: arg.width, height: arg.height, channels: 3 }
    })
      .png()
      .toBuffer();

    inlineIndex += 1;
    images.push({
      sourceType: "pdf-inline-image",
      fileName,
      fileType: "application/pdf",
      imageIndex: inlineIndex,
      buffer: pngBuffer
    });
  }

  return images;
}

export async function extractPdfCandidates(
  fileName: string,
  fileBuffer: Buffer
): Promise<CandidateImage[]> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(fileBuffer),
    useWorkerFetch: false,
    isEvalSupported: false
  });

  const doc = await loadingTask.promise;
  const output: CandidateImage[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.3 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context as any, viewport }).promise;
    const pageBuffer = canvas.toBuffer("image/png");

    output.push({
      sourceType: "pdf-page",
      fileName,
      fileType: "application/pdf",
      pageNumber,
      imageIndex: 1,
      buffer: pageBuffer
    });

    const inlineImages = await extractInlineImages(page, fileName);
    inlineImages.forEach((image, idx) =>
      output.push({
        ...image,
        pageNumber,
        imageIndex: idx + 1
      })
    );
  }

  await loadingTask.destroy();
  return output;
}
