import exifr from "exifr";
import type { Signal } from "@/lib/server/pipeline/types";

const SUSPICIOUS_SOFTWARE_MARKERS = [
  "midjourney",
  "stable diffusion",
  "dall",
  "photoshop generative fill",
  "firefly",
  "comfyui",
  "fooocus",
  "sdxl"
];

export interface MetadataInspection {
  findings: string[];
  signals: Signal[];
  rawMetadata: Record<string, unknown> | null;
}

export async function inspectMetadata(buffer: Buffer): Promise<MetadataInspection> {
  let metadata: Record<string, unknown> | null = null;
  const findings: string[] = [];
  const signals: Signal[] = [];

  try {
    metadata = (await exifr.parse(buffer, true)) as Record<string, unknown> | null;
  } catch {
    findings.push("Metadata parsing failed.");
    signals.push({
      id: "metadata_parse_failure",
      reason: "Metadata could not be parsed, reducing certainty.",
      uncertaintyPenalty: 10,
      limitation: "Unable to inspect full EXIF/XMP tags."
    });
    return { findings, signals, rawMetadata: null };
  }

  if (!metadata || Object.keys(metadata).length === 0) {
    findings.push("No metadata found.");
    signals.push({
      id: "missing_metadata",
      reason: "No camera/export metadata available.",
      weightGenerated: 12,
      uncertaintyPenalty: 10
    });
    return { findings, signals, rawMetadata: metadata };
  }

  const software = String(metadata.Software ?? metadata.CreatorTool ?? "").toLowerCase();
  if (software) {
    findings.push(`Software tag: ${software}`);
    if (SUSPICIOUS_SOFTWARE_MARKERS.some((marker) => software.includes(marker))) {
      signals.push({
        id: "ai_software_tag",
        reason: `Export software tag suggests AI pipeline: ${software}`,
        artifact: "Suspicious software metadata",
        weightGenerated: 30,
        weightEdited: 18
      });
    }
  }

  if (!metadata.Make && !metadata.Model) {
    findings.push("Camera make/model tags missing.");
    signals.push({
      id: "no_camera_tags",
      reason: "Camera make/model is missing.",
      weightGenerated: 8,
      uncertaintyPenalty: 8
    });
  } else {
    findings.push("Camera tags present.");
    signals.push({
      id: "camera_tags_present",
      reason: "Camera make/model present in metadata.",
      weightReal: 8
    });
  }

  return { findings, signals, rawMetadata: metadata };
}
