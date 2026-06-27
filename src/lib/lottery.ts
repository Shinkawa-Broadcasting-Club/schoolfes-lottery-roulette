import { DEFAULT_APP_THEME, isAppTheme, type AppTheme } from './theme';

export const LOTTERY_MIN_NUMBER = 0;
export const LOTTERY_MAX_NUMBER = 999;
export const MAX_PRIZE_COUNT = 7;
export const DEFAULT_PRIZE_NAMES = ['1等', '2等', '3等', '4等', '5等', '6等', '7等'] as const;

export {
  RESULTS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY
} from './storage/storageKeys';

export {
  parseStoredPrizes,
  parseStoredSettings,
  serializeSettings
} from './storage/settingsStorage';

export { parseStoredResults, serializeResults } from './storage/resultsStorage';

export const DIGIT_REVEAL_ORDERS = ['ones-first', 'hundreds-first'] as const;
export type DigitRevealOrder = (typeof DIGIT_REVEAL_ORDERS)[number];

export type LotterySettings = {
  prizes: PrizeName[];
  digitRevealOrder: DigitRevealOrder;
  theme: AppTheme;
};

export type PrizeName = string;
export type LotteryResults = Record<PrizeName, number[]>;

export type ResultLocation = {
  sectionName: PrizeName;
  index: number;
};

const UINT32_RANGE = 0x1_0000_0000;

type CryptoLike = Pick<Crypto, 'getRandomValues'>;

export function isDigitRevealOrder(value: unknown): value is DigitRevealOrder {
  return typeof value === 'string' && (DIGIT_REVEAL_ORDERS as readonly string[]).includes(value);
}

export function createDefaultPrizes(): PrizeName[] {
  return [...DEFAULT_PRIZE_NAMES];
}

export function createDefaultSettings(): LotterySettings {
  return {
    prizes: createDefaultPrizes(),
    digitRevealOrder: 'ones-first',
    theme: DEFAULT_APP_THEME
  };
}

export function getDigitRevealSequence(order: DigitRevealOrder): readonly [number, number, number] {
  return order === 'hundreds-first' ? [2, 1, 0] : [0, 1, 2];
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

export function isNumberInRange(
  value: number,
  min = LOTTERY_MIN_NUMBER,
  max = LOTTERY_MAX_NUMBER
): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function parseThreeDigitNumber(
  value: string | number,
  min = LOTTERY_MIN_NUMBER,
  max = LOTTERY_MAX_NUMBER
): number | null {
  const trimmed = String(value).trim();
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

export function reconcileResultsForPrizes(
  previousPrizes: readonly PrizeName[],
  nextPrizes: readonly PrizeName[],
  results: LotteryResults
): LotteryResults {
  const reconciled = createEmptyResults(nextPrizes);
  const usedNumbers = new Set<number>();
  const nextSet = new Set(nextPrizes);
  const previousSet = new Set(previousPrizes);

  const pushUnique = (prize: PrizeName, values: readonly number[]) => {
    for (const value of values) {
      if (!isNumberInRange(value, LOTTERY_MIN_NUMBER, LOTTERY_MAX_NUMBER)) continue;
      if (usedNumbers.has(value)) continue;
      reconciled[prize].push(value);
      usedNumbers.add(value);
    }
  };

  for (const prize of nextPrizes) {
    if (previousSet.has(prize)) {
      pushUnique(prize, results[prize] ?? []);
    }
  }

  nextPrizes.forEach((nextPrize, index) => {
    if (reconciled[nextPrize].length > 0) return;

    const previousPrize = previousPrizes[index];
    if (!previousPrize || previousPrize === nextPrize) return;
    if (nextSet.has(previousPrize)) return;

    pushUnique(nextPrize, results[previousPrize] ?? []);
  });

  return reconciled;
}

export { isAppTheme };
