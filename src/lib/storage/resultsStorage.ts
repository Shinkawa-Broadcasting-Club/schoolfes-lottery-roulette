import {
  createEmptyResults,
  DEFAULT_PRIZE_NAMES,
  isNumberInRange,
  LOTTERY_MAX_NUMBER,
  LOTTERY_MIN_NUMBER,
  type LotteryResults,
  type PrizeName
} from '$lib/lottery';

export const RESULTS_SCHEMA_VERSION = 1;

type ResultsPayloadV1 = {
  version: typeof RESULTS_SCHEMA_VERSION;
  results: LotteryResults;
};

export function serializeResults(results: LotteryResults): string {
  const payload: ResultsPayloadV1 = {
    version: RESULTS_SCHEMA_VERSION,
    results
  };
  return JSON.stringify(payload);
}

function parseFlatResults(
  parsed: Record<string, unknown>,
  prizes: readonly PrizeName[]
): LotteryResults | null {
  const restored = createEmptyResults(prizes);
  const usedNumbers = new Set<number>();

  for (const prize of prizes) {
    const list = parsed[prize];
    if (!Array.isArray(list)) continue;

    for (const value of list) {
      if (typeof value !== 'number') continue;
      if (!isNumberInRange(value, LOTTERY_MIN_NUMBER, LOTTERY_MAX_NUMBER)) continue;
      if (usedNumbers.has(value)) continue;

      restored[prize].push(value);
      usedNumbers.add(value);
    }
  }

  return restored;
}

export function parseStoredResults(
  raw: string | null,
  prizes: readonly PrizeName[] = DEFAULT_PRIZE_NAMES
): LotteryResults | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

    const record = parsed as Record<string, unknown>;
    if (record.version === RESULTS_SCHEMA_VERSION && record.results !== undefined) {
      if (typeof record.results !== 'object' || record.results === null || Array.isArray(record.results)) {
        return null;
      }
      return parseFlatResults(record.results as Record<string, unknown>, prizes);
    }

    return parseFlatResults(record, prizes);
  } catch {
    return null;
  }
}
