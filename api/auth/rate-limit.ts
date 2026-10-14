import { createHash } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const MAX_TRACKED_EMAILS = 5000;

type AttemptWindow = { startedAt: number; attempts: number };
const windows = new Map<string, AttemptWindow>();

function keyFor(email: string) {
  return createHash("sha256").update(email).digest("hex");
}

function prune(now: number) {
  for (const [key, attemptWindow] of windows) {
    if (now - attemptWindow.startedAt >= WINDOW_MS) windows.delete(key);
  }
}

export function getLoginRetryAfter(email: string, now = Date.now()) {
  const key = keyFor(email);
  const attemptWindow = windows.get(key);
  if (!attemptWindow || now - attemptWindow.startedAt >= WINDOW_MS) return 0;
  if (attemptWindow.attempts < MAX_ATTEMPTS) return 0;
  return Math.max(1, Math.ceil((attemptWindow.startedAt + WINDOW_MS - now) / 1000));
}

export function recordLoginFailure(email: string, now = Date.now()) {
  if (windows.size >= MAX_TRACKED_EMAILS) {
    prune(now);
    if (windows.size >= MAX_TRACKED_EMAILS) {
      const oldestKey = windows.keys().next().value;
      if (oldestKey) windows.delete(oldestKey);
    }
  }
  const key = keyFor(email);
  const existing = windows.get(key);
  if (!existing || now - existing.startedAt >= WINDOW_MS) {
    windows.set(key, { startedAt: now, attempts: 1 });
    return;
  }
  existing.attempts += 1;
}

export function clearLoginFailures(email: string) {
  windows.delete(keyFor(email));
}
