import { describe, expect, it } from 'vitest';
import {
  createEmptyResults,
  createDefaultPrizes,
  createDefaultSettings,
  DEFAULT_PRIZE_NAMES,
  getDigitRevealSequence,
  hasDuplicateResult,
  isDigitRevealOrder,
  LOTTERY_MAX_NUMBER,
  LOTTERY_MIN_NUMBER,
  MAX_PRIZE_COUNT,
  parseThreeDigitNumber,
  parseStoredPrizes,
  parseStoredResults,
  parseStoredSettings,
  pickAvailableNumber,
  randomInt,
  reconcileResultsForPrizes
} from './lottery';

describe('parseThreeDigitNumber', () => {
  it('accepts integers in range 0..999', () => {
    expect(parseThreeDigitNumber('0')).toBe(0);
    expect(parseThreeDigitNumber('999')).toBe(999);
    expect(parseThreeDigitNumber('007')).toBe(7);
    expect(parseThreeDigitNumber(55)).toBe(55);
  });

  it('rejects invalid values', () => {
    expect(parseThreeDigitNumber('-1')).toBeNull();
    expect(parseThreeDigitNumber('1000')).toBeNull();
    expect(parseThreeDigitNumber('12abc')).toBeNull();
    expect(parseThreeDigitNumber('')).toBeNull();
  });
});

describe('randomInt', () => {
  it('returns values in inclusive range', () => {
    for (let i = 0; i < 200; i++) {
      const value = randomInt(LOTTERY_MIN_NUMBER, LOTTERY_MAX_NUMBER);
      expect(value).toBeGreaterThanOrEqual(LOTTERY_MIN_NUMBER);
      expect(value).toBeLessThanOrEqual(LOTTERY_MAX_NUMBER);
    }
  });

  it('throws when range is invalid', () => {
    expect(() => randomInt(10, 9)).toThrowError('Invalid random range');
  });
});

describe('pickAvailableNumber', () => {
  it('returns null when all numbers are used', () => {
    const used = new Set<number>([1, 2, 3]);
    expect(pickAvailableNumber(1, 3, used)).toBeNull();
  });

  it('picks only unused numbers', () => {
    const used = new Set<number>([1, 2, 4]);
    for (let i = 0; i < 50; i++) {
      const value = pickAvailableNumber(1, 5, used);
      expect(value === 3 || value === 5).toBe(true);
    }
  });
});

describe('lottery result helpers', () => {
  it('creates an empty list for every prize', () => {
    const prizes = createDefaultPrizes();
    const results = createEmptyResults(prizes);
    for (const prize of prizes) {
      expect(results[prize]).toEqual([]);
    }
  });

  it('detects duplicates with an optional excluded location', () => {
    const prizes = createDefaultPrizes();
    const results = createEmptyResults(prizes);
    results['1等'] = [123];

    expect(hasDuplicateResult(results, 123, prizes)).toBe(true);
    expect(hasDuplicateResult(results, 123, prizes, { sectionName: '1等', index: 0 })).toBe(false);
  });

  it('restores only valid unique stored results', () => {
    const prizes = createDefaultPrizes();
    const restored = parseStoredResults(
      JSON.stringify({
        '1等': [7, 1000, 8],
        '2等': [7, 9],
        ignored: [1]
      }),
      prizes
    );

    expect(restored?.['1等']).toEqual([7, 8]);
    expect(restored?.['2等']).toEqual([9]);
  });

  it('preserves results by position when prize names change', () => {
    const previousPrizes = ['1等', '2等'];
    const nextPrizes = ['特賞', '参加賞'];
    const results = createEmptyResults(previousPrizes);
    results['1等'] = [101];
    results['2等'] = [202];

    expect(reconcileResultsForPrizes(previousPrizes, nextPrizes, results)).toEqual({
      特賞: [101],
      参加賞: [202]
    });
  });

  it('preserves results by prize name when order changes', () => {
    const previousPrizes = ['1等', '2等', '3等'];
    const nextPrizes = ['3等', '1等', '2等'];
    const results = createEmptyResults(previousPrizes);
    results['1等'] = [101];
    results['2等'] = [202];
    results['3等'] = [303];

    expect(reconcileResultsForPrizes(previousPrizes, nextPrizes, results)).toEqual({
      '3等': [303],
      '1等': [101],
      '2等': [202]
    });
  });
});

describe('prize settings helpers', () => {
  it('creates default 1等-7等 prizes', () => {
    expect(createDefaultPrizes()).toEqual([...DEFAULT_PRIZE_NAMES]);
    expect(createDefaultPrizes()).toHaveLength(MAX_PRIZE_COUNT);
  });

  it('creates default settings with ones-first reveal order and orange theme', () => {
    expect(createDefaultSettings()).toEqual({
      prizes: [...DEFAULT_PRIZE_NAMES],
      digitRevealOrder: 'ones-first',
      theme: 'orange'
    });
  });

  it('returns reveal sequence for each digit order', () => {
    expect(getDigitRevealSequence('ones-first')).toEqual([0, 1, 2]);
    expect(getDigitRevealSequence('hundreds-first')).toEqual([2, 1, 0]);
  });

  it('restores valid custom prize names', () => {
    expect(parseStoredPrizes(JSON.stringify(['特賞', 'A賞', 'B賞']))).toEqual([
      '特賞',
      'A賞',
      'B賞'
    ]);
  });

  it('restores legacy prize-only settings', () => {
    expect(parseStoredSettings(JSON.stringify(['1等', '2等']))).toEqual({
      prizes: ['1等', '2等'],
      digitRevealOrder: 'ones-first',
      theme: 'orange'
    });
  });

  it('restores full settings object', () => {
    expect(
      parseStoredSettings(
        JSON.stringify({
          prizes: ['特賞', 'A賞'],
          digitRevealOrder: 'hundreds-first',
          theme: 'dark'
        })
      )
    ).toEqual({
      prizes: ['特賞', 'A賞'],
      digitRevealOrder: 'hundreds-first',
      theme: 'dark'
    });
  });

  it('falls back to orange theme when stored theme is invalid', () => {
    expect(
      parseStoredSettings(
        JSON.stringify({
          prizes: ['1等'],
          digitRevealOrder: 'ones-first',
          theme: 'neon'
        })
      )
    ).toEqual({
      prizes: ['1等'],
      digitRevealOrder: 'ones-first',
      theme: 'orange'
    });
  });

  it('falls back to ones-first when stored digitRevealOrder is invalid', () => {
    expect(
      parseStoredSettings(
        JSON.stringify({
          prizes: ['1等'],
          digitRevealOrder: 'reverse',
          theme: 'dark'
        })
      )
    ).toEqual({
      prizes: ['1等'],
      digitRevealOrder: 'ones-first',
      theme: 'dark'
    });
  });

  it('validates digit reveal order', () => {
    expect(isDigitRevealOrder('ones-first')).toBe(true);
    expect(isDigitRevealOrder('hundreds-first')).toBe(true);
    expect(isDigitRevealOrder('random')).toBe(false);
  });
});
