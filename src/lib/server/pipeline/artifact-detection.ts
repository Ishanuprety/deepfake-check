import sharp from "sharp";
import type { Signal } from "@/lib/server/pipeline/types";
import type { NormalizedImage } from "@/lib/server/pipeline/image-normalization";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateRowRepeatRatio(data: Uint8Array, width: number, height: number): number {
  if (width <= 1 || height <= 1) return 0;
  let repeatedRows = 0;
  const rowSize = width;
  for (let y = 1; y < height; y += 1) {
    let equalPixels = 0;
    for (let x = 0; x < width; x += 1) {
      if (data[y * rowSize + x] === data[(y - 1) * rowSize + x]) {
        equalPixels += 1;
      }
    }
    if (equalPixels / width > 0.92) {
      repeatedRows += 1;
    }
  }
  return repeatedRows / (height - 1);
}

export async function detectArtifacts(normalized: NormalizedImage): Promise<Signal[]> {
  const signals: Signal[] = [];
  const meanStdev = average(normalized.stdev);

  if (meanStdev < 18) {
    signals.push({
      id: "oversmoothing",
      reason: "Texture variance is unusually low, indicating potential AI smoothing.",
      artifact: "AI-style oversmoothing",
      weightGenerated: 18,
      weightEdited: 10
    });
  }

  if (normalized.width < 500 || normalized.height < 500) {
    signals.push({
      id: "low_resolution",
      reason: "Low-resolution input reduces forensic confidence.",
      uncertaintyPenalty: 20,
      limitation: "Resolution is too low for strong artifact analysis."
    });
  }

  const grayscaleRaw = await sharp(normalized.buffer)
    .grayscale()
    .resize(128, 128, { fit: "fill" })
    .raw()
    .toBuffer();

  const repeatRatio = calculateRowRepeatRatio(grayscaleRaw, 128, 128);
  if (repeatRatio > 0.2) {
    signals.push({
      id: "repeated_patterns",
      reason: "Repeated texture rows suggest synthetic texture generation.",
      artifact: "Repeated texture patterns",
      weightGenerated: 16
    });
  }

  const luminanceRange = Math.max(...normalized.mean) - Math.min(...normalized.mean);
  if (luminanceRange < 4) {
    signals.push({
      id: "flat_lighting",
      reason: "Lighting appears unnaturally flat across channels.",
      artifact: "Potential synthetic lighting behavior",
      weightGenerated: 10,
      uncertaintyPenalty: 8
    });
  }

  signals.push({
    id: "undetectable_face_hand_detail",
    reason: "Facial/hand anomaly detection is not enabled in this version.",
    limitation: "No landmark model integrated for face/hand consistency checks.",
    uncertaintyPenalty: 8
  });

  signals.push({
    id: "undetectable_shadow_reflection_geometry",
    reason: "Advanced geometry/reflection consistency checks are limited.",
    limitation: "No 3D lighting solver integrated; reflection and shadow checks are heuristic only.",
    uncertaintyPenalty: 6
  });

  return signals;
}
