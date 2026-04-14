import { appConfig } from "@/lib/server/config";

const requestTracker = new Map<string, number[]>();
const WINDOW_MS = 60_000;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const current = requestTracker.get(key) ?? [];
  const recent = current.filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  requestTracker.set(key, recent);

  if (recent.length > appConfig.rateLimitPerMinute) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true };
}
