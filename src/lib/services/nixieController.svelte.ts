import { getDigitRevealSequence, type DigitRevealOrder } from '$lib/lottery';

const NIXIE_CONFIG = {
  DIGIT_INTERVAL: 100,
  REVEAL_TIMES: [1000, 3000, 5000],
  DIGIT_COUNT: 3
} as const;

export function createNixieController(getDigitOrder: () => DigitRevealOrder) {
  let digits = $state<string[]>(['', '', '']);
  let intervals: ReturnType<typeof setInterval>[] = [];
  let timeouts: ReturnType<typeof setTimeout>[] = [];

  function clearTimers() {
    intervals.forEach((interval) => clearInterval(interval));
    intervals = [];
    timeouts.forEach((timeout) => clearTimeout(timeout));
    timeouts = [];
  }

  function clearDisplay() {
    digits = ['', '', ''];
  }

  function reset() {
    clearDisplay();
    clearTimers();
  }

  function startRandomization() {
    clearDisplay();
    clearTimers();
    intervals = Array.from({ length: NIXIE_CONFIG.DIGIT_COUNT }, (_, index) =>
      setInterval(() => {
        digits[index] = String(Math.floor(Math.random() * 10));
        digits = [...digits];
      }, NIXIE_CONFIG.DIGIT_INTERVAL)
    );
  }

  function stopRandomization(finalNumber: number) {
    const finalDigits = String(finalNumber).padStart(NIXIE_CONFIG.DIGIT_COUNT, '0').split('');
    const sequence = getDigitRevealSequence(getDigitOrder());

    sequence.forEach((digitIndex, step) => {
      const time = NIXIE_CONFIG.REVEAL_TIMES[step];
      const timeout = setTimeout(() => {
        const interval = intervals[digitIndex];
        if (!interval) return;
        clearInterval(interval);
        digits[digitIndex] = finalDigits[2 - digitIndex];
        digits = [...digits];
      }, time);
      timeouts.push(timeout);
    });

    return NIXIE_CONFIG.REVEAL_TIMES[NIXIE_CONFIG.REVEAL_TIMES.length - 1];
  }

  function destroy() {
    clearTimers();
  }

  return {
    get digits() {
      return digits;
    },
    reset,
    startRandomization,
    stopRandomization,
    destroy
  };
}

export type NixieController = ReturnType<typeof createNixieController>;

export function createDrumrollPlayer(getAudio: () => HTMLAudioElement | null) {
  function play() {
    const drum = getAudio();
    if (!drum) return;
    try {
      drum.pause();
      drum.currentTime = 0;
    } catch {
      /* 未ロード等は無視 */
    }
    drum.play().catch(() => {});
  }

  return { play };
}
