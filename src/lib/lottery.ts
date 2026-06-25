export const LOTTERY_MIN_NUMBER = 0;
export const LOTTERY_MAX_NUMBER = 999;
export const MAX_PRIZE_COUNT = 7;
export const DEFAULT_PRIZE_NAMES = ['1等', '2等', '3等', '4等', '5等', '6等', '7等'] as const;
export const RESULTS_STORAGE_KEY = 'sbc-lottery-roulette-results-v1';
export const SETTINGS_STORAGE_KEY = 'sbc-lottery-roulette-settings-v1';

export type PrizeName = string;
export type LotteryResults = Record<PrizeName, number[]>;

export type ResultLocation = {
  sectionName: PrizeName;
  index: number;
};

const UINT32_RANGE = 0x1_0000_0000;

type CryptoLike = Pick<Crypto, 'getRandomValues'>;

export function createDefaultPrizes(): PrizeName[] {
  return [...DEFAULT_PRIZE_NAMES];
}

export function normalizePrizeName(name: string): PrizeName {
  return name.trim();
}

export function createEmptyResults(prizes: readonly PrizeName[] = DEFAULT_PRIZE_NAMES): LotteryResults {
  return prizes.reduce(
    (acc, prize) => {
      acc[prize] = [];
      return acc;
    },
    {} as LotteryResults
  );
}

export function parseStoredPrizes(raw: string | null): PrizeName[] | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    if (!parsed.every((value) => typeof value === 'string')) return null;

    const normalized = parsed.map(normalizePrizeName).slice(0, MAX_PRIZE_COUNT);

    if (normalized.length === 0) return null;
    if (normalized.some((name) => !name)) return null;
    if (new Set(normalized).size !== normalized.length) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function isNumberInRange(
  value: number,
  min = LOTTERY_MIN_NUMBER,
  max = LOTTERY_MAX_NUMBER
): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function parseThreeDigitNumber(
  value: string,
  min = LOTTERY_MIN_NUMBER,
  max = LOTTERY_MAX_NUMBER
): number | null {
  const trimmed = value.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return isNumberInRange(parsed, min, max) ? parsed : null;
}

export function randomInt(
  min: number,
  max: number,
  cryptoImpl: CryptoLike | undefined = globalThis.crypto
): number {
  const range = max - min + 1;
  if (!Number.isInteger(min) || !Number.isInteger(max) || range <= 0) {
    throw new Error('Invalid random range');
  }

  if (range > UINT32_RANGE) {
    return min + Math.floor(Math.random() * range);
  }

  if (cryptoImpl?.getRandomValues) {
    const threshold = Math.floor(UINT32_RANGE / range) * range;
    const buffer = new Uint32Array(1);
    let value = 0;
    do {
      cryptoImpl.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= threshold);
    return min + (value % range);
  }

  return min + Math.floor(Math.random() * range);
}

export function pickAvailableNumber(
  min: number,
  max: number,
  usedNumbers: Set<number>,
  cryptoImpl: CryptoLike | undefined = globalThis.crypto
): number | null {
  const available: number[] = [];
  for (let number = min; number <= max; number++) {
    if (!usedNumbers.has(number)) {
      available.push(number);
    }
  }

  if (available.length === 0) return null;
  const index = randomInt(0, available.length - 1, cryptoImpl);
  return available[index];
}

export function hasDuplicateResult(
  results: LotteryResults,
  number: number,
  prizes: readonly PrizeName[] = Object.keys(results),
  exclude?: ResultLocation
): boolean {
  return prizes.some((prize) =>
    (results[prize] ?? []).some(
      (value, index) =>
        value === number && (!exclude || exclude.sectionName !== prize || exclude.index !== index)
    )
  );
}

export function getUsedNumbers(
  results: LotteryResults,
  prizes: readonly PrizeName[] = Object.keys(results)
): Set<number> {
  return new Set(prizes.flatMap((prize) => results[prize] ?? []));
}

export function parseStoredResults(
  raw: string | null,
  prizes: readonly PrizeName[] = DEFAULT_PRIZE_NAMES
): LotteryResults | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
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
  } catch {
    return null;
  }
}

export function reconcileResultsForPrizes(
  previousPrizes: readonly PrizeName[],
  nextPrizes: readonly PrizeName[],
  results: LotteryResults
): LotteryResults {
  const reconciled = createEmptyResults(nextPrizes);
  const usedNumbers = new Set<number>();

  nextPrizes.forEach((nextPrize, index) => {
    const previousPrize = previousPrizes[index];
    const source = results[previousPrize] ?? results[nextPrize] ?? [];

    for (const value of source) {
      if (!isNumberInRange(value, LOTTERY_MIN_NUMBER, LOTTERY_MAX_NUMBER)) continue;
      if (usedNumbers.has(value)) continue;
      reconciled[nextPrize].push(value);
      usedNumbers.add(value);
    }
  });

  return reconciled;
}
