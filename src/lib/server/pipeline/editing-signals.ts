import sharp from "sharp";
import type { Signal } from "@/lib/server/pipeline/types";
import type { NormalizedImage } from "@/lib/server/pipeline/image-normalization";

export async function detectEditingSignals(normalized: NormalizedImage): Promise<Signal[]> {
  const signals: Signal[] = [];
  const metadata = await sharp(normalized.buffer).metadata();

  if ((metadata.hasAlpha ?? false) && (metadata.channels ?? 0) >= 4) {
    signals.push({
      id: "alpha_channel_present",
      reason: "Alpha channel may indicate compositing or layered export.",
      artifact: "Potential compositing/editing",
      weightEdited: 20,
      uncertaintyPenalty: 4
    });
  }

  if ((metadata.density ?? 0) > 600) {
    signals.push({
      id: "high_density_export",
      reason: "Very high export density can indicate transformed or re-exported input.",
      weightEdited: 10
    });
  }

  if ((metadata.space ?? "").toLowerCase().includes("cmyk")) {
    signals.push({
      id: "cmyk_transcode",
      reason: "CMYK/transcoded color space can reflect editing workflows.",
      weightEdited: 8
    });
  }

  return signals;
}
