import { GET as resultsGet } from "@/app/api/results/[id]/route";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Params) {
  return resultsGet(request, context);
}
