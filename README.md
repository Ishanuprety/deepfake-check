# Deepfake Check

Deepfake Check is a production-oriented Next.js web application that analyzes uploaded images and PDFs to estimate whether content is:

- likely real
- likely AI-generated
- likely AI-edited
- inconclusive

The current detector is heuristic by design and intentionally conservative.

> This assessment is heuristic and should not be treated as definitive forensic proof.

## Stack

- Frontend: Next.js App Router + TypeScript
- Backend: Next.js API routes (Node runtime)
- Styling: Tailwind CSS
- Image processing: `sharp`
- PDF parsing/rendering: `pdfjs-dist` + `@napi-rs/canvas`
- Metadata extraction: `exifr`
- Validation: `zod`-compatible TypeScript helpers
- Testing: Vitest

## Features

- Drag-and-drop + file picker upload
- Multi-file submission with progress bar
- Supports JPG/JPEG/PNG/WEBP/BMP/TIFF/HEIC/GIF/PDF
- File size/type validation and graceful errors
- PDF page rendering and inline embedded image extraction (where available)
- Modular analysis pipeline with explicit stages
- Per-file and per-page/per-image results
- Confidence score, reasons, artifacts, limitations, and follow-up checks
- Downloadable machine-readable JSON report
- Local session history page
- Rate-limiting-ready API pattern
- Temporary storage with cleanup

## Project Structure

```text
src/
  app/
    api/
      analyze/route.ts           # upload + process
      upload/route.ts            # alias endpoint for upload submission
      analyze/[id]/route.ts      # alias polling endpoint
      results/[id]/route.ts      # retrieval endpoint
      report/[id]/route.ts       # downloadable JSON
    about/page.tsx
    history/page.tsx
    results/[id]/page.tsx
    page.tsx
  components/
    upload-form.tsx
    results-view.tsx
    history-list.tsx
  lib/
    constants.ts
    validation.ts
    format.ts
    server/
      config.ts
      logger.ts
      rate-limit.ts
      storage.ts
      pipeline/
        index.ts
        types.ts
        metadata.ts
        pdf.ts
        image-normalization.ts
        artifact-detection.ts
        editing-signals.ts
        scoring.ts
        scoring.test.ts
    validation.test.ts
  types/
    report.ts
```

## Pipeline Architecture

1. **File ingestion**: validate count, size, and extension/MIME.
2. **Metadata extraction**: parse EXIF/XMP tags and software export markers.
3. **PDF parsing**:
   - render each page as an image
   - extract inline embedded images where possible
4. **Image normalization**: rotate, resize to analysis bounds, normalize format.
5. **Artifact detection**: oversmoothing, repeated patterns, flat lighting, low-resolution penalties.
6. **Heuristic scoring**: weighted generated/edited/real signals with uncertainty penalties.
7. **Result aggregation**: per-item and submission-level classification summary.
8. **Report generation**: human-readable UI + downloadable JSON.

## API Endpoints

- `POST /api/upload` — upload submission (alias to analyze flow)
- `POST /api/analyze` — upload + analysis in one request
- `GET /api/analyze/:id` — analysis retrieval alias
- `GET /api/results/:id` — polling/retrieval endpoint
- `GET /api/report/:id` — download report JSON

## JSON Report Shape

```json
{
  "summary": {
    "overall_assessment": "likely real | likely AI-generated | likely AI-edited | mixed | inconclusive",
    "overall_confidence": 0,
    "notes": []
  },
  "files": [
    {
      "file_name": "",
      "file_type": "",
      "results": [
        {
          "page_number": 1,
          "image_index": 1,
          "classification": "",
          "confidence": 0,
          "reasons": [],
          "artifacts_detected": [],
          "metadata_findings": [],
          "limitations": [],
          "follow_up_checks": []
        }
      ]
    }
  ]
}
```

## Scoring Logic (Current MVP)

- Signals contribute to one or more buckets:
  - `generated`
  - `edited`
  - `real`
  - `uncertaintyPenalty`
- Confidence is derived from weighted evidence minus uncertainty penalties.
- Classification thresholds are conservative and configurable via env:
  - `SCORING_GENERATED_MARGIN`
  - `SCORING_EDITED_MARGIN`
  - `SCORING_MIN_CONFIDENCE`
- Low quality or incomplete evidence tends to result in **inconclusive**.

## Plugging in Stronger Models Later

Primary extension points:

- `src/lib/server/pipeline/artifact-detection.ts`
  - Add ML-based detectors (diffusion fingerprints, GAN traces, forensic CNNs)
- `src/lib/server/pipeline/editing-signals.ts`
  - Add segmentation-based compositing/editing detectors
- `src/lib/server/pipeline/metadata.ts`
  - Integrate provenance APIs, signature checks, C2PA verification
- `src/lib/server/pipeline/scoring.ts`
  - Replace fixed weights with calibrated model ensemble scoring

Recommended future upgrades:

- face/hand landmark anomaly model
- shadow/reflection geometry model
- OCR-based warped-text/logo checks
- asynchronous queue + persistent datastore for very large jobs

## Setup

1. Install Node.js 20+.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy env file:

   ```bash
   cp .env.example .env.local
   ```

4. Run development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Tests

Run unit tests:

```bash
npm run test
```

Current tests cover:
- scoring helper behavior
- file validation/sanitization helpers

## Security/Operational Notes

- Uploaded files are validated by MIME/extension and size.
- Temporary files are cleaned up after processing.
- Basic in-memory rate limiting is enabled.
- Inputs are sanitized before filename use.
- Logging hooks are included in `src/lib/server/logger.ts`.

## Caveats

- Heuristic checks are not equivalent to forensic proof.
- PDF embedded image extraction is best-effort for inline images.
- In-memory storage is suitable for MVP/single instance; production should use persistent storage/queue.
