import { MAX_PRIZE_COUNT, normalizePrizeName, type PrizeName } from '$lib/lottery';

export function parsePrizesFromUnknown(value: unknown): PrizeName[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item) => typeof item === 'string')) return null;

  const normalized = value.map(normalizePrizeName).slice(0, MAX_PRIZE_COUNT);
  if (normalized.length === 0) return null;
  if (normalized.some((name) => !name)) return null;
  if (new Set(normalized).size !== normalized.length) return null;
  return normalized;
}

export function parseStoredPrizes(raw: string | null): PrizeName[] | null {
  if (!raw) return null;

  try {
    return parsePrizesFromUnknown(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}
