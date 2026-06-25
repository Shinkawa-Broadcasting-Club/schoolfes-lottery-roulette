<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import AppDialog, { type DialogKind } from '$lib/components/AppDialog.svelte';
  import LotteryControls from '$lib/components/LotteryControls.svelte';
  import LotterySettings from '$lib/components/LotterySettings.svelte';
  import NixieDisplay from '$lib/components/NixieDisplay.svelte';
  import ResultsPanel from '$lib/components/ResultsPanel.svelte';
  import {
    createEmptyResults,
    createDefaultPrizes,
    getUsedNumbers,
    hasDuplicateResult,
    LOTTERY_MAX_NUMBER,
    LOTTERY_MIN_NUMBER,
    parseStoredResults,
    parseStoredPrizes,
    parseThreeDigitNumber,
    pickAvailableNumber,
    reconcileResultsForPrizes,
    RESULTS_STORAGE_KEY,
    SETTINGS_STORAGE_KEY,
    type LotteryResults,
    type PrizeName
  } from '$lib/lottery';

  const CONFIG = {
    NUMBER: {
      MIN: LOTTERY_MIN_NUMBER,
      MAX: LOTTERY_MAX_NUMBER
    },
    ANIMATION: {
      DIGIT_INTERVAL: 100,
      REVEAL_TIMES: [1000, 3000, 5000],
      DIGIT_COUNT: 3
    },
    VALIDATION: {
      MESSAGES: {
        NO_PRIZE: '抽選名を選択してください',
        INVALID_RANGE: '最小値と最大値は0〜999の整数で入力してください',
        INVALID_NUMBER: '0〜999の整数を入力してください',
        DUPLICATE_NUMBER: 'その番号はすでに当選済みです',
        NO_AVAILABLE_NUMBER: '指定した範囲に未当選番号がありません',
        CONFIRM_DELETE: '次の番号を削除しますか？'
      }
    }
  } as const;

  function loadStoredPrizes(): PrizeName[] | null {
    if (typeof localStorage === 'undefined') return null;
    return parseStoredPrizes(localStorage.getItem(SETTINGS_STORAGE_KEY));
  }

  function loadStoredResults(currentPrizes: readonly PrizeName[]): LotteryResults | null {
    if (typeof localStorage === 'undefined') return null;
    return parseStoredResults(localStorage.getItem(RESULTS_STORAGE_KEY), currentPrizes);
  }

  const initialPrizes = loadStoredPrizes() ?? createDefaultPrizes();
  const initialResults = loadStoredResults(initialPrizes) ?? createEmptyResults(initialPrizes);

  let prizes = $state<PrizeName[]>(initialPrizes);
  let selectedPrize = $state<PrizeName | ''>('');
  let minValue = $state('0');
  let maxValue = $state('999');
  let drawDisabled = $state(false);
  let nixieDigits = $state<string[]>(['', '', '']);
  let results = $state<LotteryResults>(initialResults);
  let settingsVisible = $state(false);

  let drumroll = $state<HTMLAudioElement | null>(null);
  let nixieIntervals: ReturnType<typeof setInterval>[] = [];
  let revealTimeouts: ReturnType<typeof setTimeout>[] = [];

  let dialogVisible = $state(false);
  let dialogKind = $state<DialogKind>('alert');
  let dialogMessage = $state('');
  let dialogInput = $state('');

  let dialogResolveAlert: (() => void) | null = null;
  let dialogResolveConfirm: ((value: boolean) => void) | null = null;
  let dialogResolvePrompt: ((value: string | null) => void) | null = null;

  const attachDrumroll: Attachment<HTMLAudioElement> = (audioElement) => {
    drumroll = audioElement;
    return () => {
      if (drumroll === audioElement) {
        drumroll = null;
      }
    };
  };

  function validateNumber(value: string): number | null {
    return parseThreeDigitNumber(value, CONFIG.NUMBER.MIN, CONFIG.NUMBER.MAX);
  }

  function padNumber(number: number, length = 3): string {
    return String(number).padStart(length, '0');
  }

  function closeDialog() {
    dialogVisible = false;
  }

  function showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      dialogKind = 'alert';
      dialogMessage = message;
      dialogVisible = true;
      dialogResolveAlert = () => {
        dialogResolveAlert = null;
        closeDialog();
        resolve();
      };
    });
  }

  function showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      dialogKind = 'confirm';
      dialogMessage = message;
      dialogVisible = true;
      dialogResolveConfirm = (value) => {
        dialogResolveConfirm = null;
        closeDialog();
        resolve(value);
      };
    });
  }

  function showPrompt(message: string, defaultValue = ''): Promise<string | null> {
    return new Promise((resolve) => {
      dialogKind = 'prompt';
      dialogMessage = message;
      dialogInput = defaultValue;
      dialogVisible = true;
      dialogResolvePrompt = (value) => {
        dialogResolvePrompt = null;
        closeDialog();
        resolve(value);
      };
    });
  }

  function dialogConfirm() {
    if (dialogKind === 'alert') {
      dialogResolveAlert?.();
    } else if (dialogKind === 'confirm') {
      dialogResolveConfirm?.(true);
    } else {
      dialogResolvePrompt?.(dialogInput);
    }
  }

  function dialogCancel() {
    if (dialogKind === 'alert') {
      dialogResolveAlert?.();
    } else if (dialogKind === 'confirm') {
      dialogResolveConfirm?.(false);
    } else {
      dialogResolvePrompt?.(null);
    }
  }

  $effect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(prizes));
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(results));
  });

  function clearNixieTimers() {
    nixieIntervals.forEach((interval) => clearInterval(interval));
    nixieIntervals = [];
    revealTimeouts.forEach((timeout) => clearTimeout(timeout));
    revealTimeouts = [];
  }

  function clearNixieDisplay() {
    nixieDigits = ['', '', ''];
  }

  function startRandomization() {
    clearNixieDisplay();
    clearNixieTimers();

    nixieIntervals = Array.from({ length: CONFIG.ANIMATION.DIGIT_COUNT }, (_, index) =>
      setInterval(() => {
        nixieDigits[index] = String(Math.floor(Math.random() * 10));
        nixieDigits = [...nixieDigits];
      }, CONFIG.ANIMATION.DIGIT_INTERVAL)
    );
  }

  function stopRandomization(finalDigits: string[]) {
    CONFIG.ANIMATION.REVEAL_TIMES.forEach((time, index) => {
      const timeout = setTimeout(() => {
        const interval = nixieIntervals[index];
        if (!interval) return;
        clearInterval(interval);
        nixieDigits[index] = finalDigits[2 - index];
        nixieDigits = [...nixieDigits];
      }, time);
      revealTimeouts.push(timeout);
    });
  }

  function playDrumroll() {
    const drum = drumroll;
    if (!drum) return;
    try {
      drum.pause();
      drum.currentTime = 0;
    } catch {
      /* 未ロード等は無視 */
    }
    drum.play().catch(() => {});
  }

  async function validateInput(): Promise<{ prizeName: PrizeName; min: number; max: number } | null> {
    const prizeName = selectedPrize;
    const min = validateNumber(minValue);
    const max = validateNumber(maxValue);

    if (!prizeName) {
      await showAlert(CONFIG.VALIDATION.MESSAGES.NO_PRIZE);
      return null;
    }

    if (min === null || max === null || min > max) {
      await showAlert(CONFIG.VALIDATION.MESSAGES.INVALID_RANGE);
      return null;
    }

    return { prizeName, min, max };
  }

  async function addToSection(sectionName: PrizeName, number: number): Promise<boolean> {
    if (hasDuplicateResult(results, number, prizes)) {
      await showAlert(CONFIG.VALIDATION.MESSAGES.DUPLICATE_NUMBER);
      return false;
    }
    results[sectionName] = [...results[sectionName], number];
    return true;
  }

  async function editNumber(sectionName: PrizeName, index: number) {
    const currentNumber = results[sectionName][index];
    const newNumber = await showPrompt('新しい番号を入力してください:', String(currentNumber));
    if (newNumber === null || newNumber === '') return;

    const validNumber = validateNumber(newNumber);
    if (validNumber === null) {
      await showAlert(CONFIG.VALIDATION.MESSAGES.INVALID_NUMBER);
      return;
    }

    if (hasDuplicateResult(results, validNumber, prizes, { sectionName, index })) {
      await showAlert(CONFIG.VALIDATION.MESSAGES.DUPLICATE_NUMBER);
      return;
    }

    results[sectionName] = results[sectionName].map((value, i) =>
      i === index ? validNumber : value
    );
  }

  async function deleteNumber(sectionName: PrizeName, index: number) {
    const targetNumber = results[sectionName][index];
    const confirmMessage = `${CONFIG.VALIDATION.MESSAGES.CONFIRM_DELETE}\n${sectionName}: ${targetNumber}`;

    if (await showConfirm(confirmMessage)) {
      results[sectionName] = results[sectionName].filter((_, i) => i !== index);
    }
  }

  async function addManually(sectionName: PrizeName) {
    const number = await showPrompt(`${sectionName}に追加する番号を入力してください:`);
    if (number === null || number === '') return;

    const validNumber = validateNumber(number);
    if (validNumber === null) {
      await showAlert(CONFIG.VALIDATION.MESSAGES.INVALID_NUMBER);
      return;
    }

    await addToSection(sectionName, validNumber);
  }

  async function generateRandomNumber() {
    const validation = await validateInput();
    if (!validation) return;

    const { prizeName, min, max } = validation;
    const randomNumber = pickAvailableNumber(min, max, getUsedNumbers(results, prizes));

    if (randomNumber === null) {
      await showAlert(CONFIG.VALIDATION.MESSAGES.NO_AVAILABLE_NUMBER);
      return;
    }

    drawDisabled = true;
    playDrumroll();

    const digits = padNumber(randomNumber, CONFIG.ANIMATION.DIGIT_COUNT).split('');

    startRandomization();
    stopRandomization(digits);

    const revealTimes = CONFIG.ANIMATION.REVEAL_TIMES;
    const timeout = setTimeout(() => {
      void addToSection(prizeName, randomNumber);
      drawDisabled = false;
    }, revealTimes[revealTimes.length - 1]);
    revealTimeouts.push(timeout);
  }

  function openSettings() {
    settingsVisible = true;
  }

  function closeSettings() {
    settingsVisible = false;
  }

  function applySettings(nextPrizes: PrizeName[]) {
    const previousPrizes = [...prizes];
    prizes = nextPrizes;
    results = reconcileResultsForPrizes(previousPrizes, nextPrizes, results);
    if (selectedPrize && !nextPrizes.includes(selectedPrize)) {
      selectedPrize = '';
    }
    settingsVisible = false;
  }

  onDestroy(() => {
    clearNixieTimers();
  });
</script>

<div class="app-shell">
  <header class="header">
    <h1>SBC 抽選ルーレット</h1>
    <p class="copyright">©2024-2026 Koutarou Nishiwaki</p>
  </header>

  <LotteryControls
    {prizes}
    bind:selectedPrize
    bind:minValue
    bind:maxValue
    {drawDisabled}
    onDraw={generateRandomNumber}
    onOpenSettings={openSettings}
  />

  <main class="wrapper">
    <NixieDisplay digits={nixieDigits} />
    <ResultsPanel
      {prizes}
      {results}
      onAddManually={addManually}
      onEditNumber={editNumber}
      onDeleteNumber={deleteNumber}
    />
  </main>
</div>

<audio {@attach attachDrumroll} id="drumroll" src="/drumroll.mp3"></audio>

<LotterySettings
  visible={settingsVisible}
  {prizes}
  onApply={applySettings}
  onClose={closeSettings}
/>

<AppDialog
  visible={dialogVisible}
  kind={dialogKind}
  message={dialogMessage}
  bind:input={dialogInput}
  onConfirm={dialogConfirm}
  onCancel={dialogCancel}
/>

<style>
  :global(:root) {
    --amber: #ff9e2c;
    --amber-deep: #b85c12;

    --panel: #14110c;
    --panel-raised: #1b1710;
    --panel-sunken: #100d09;

    --ink: #e9ddc6;
    --ink-dim: #8c8068;

    --line: #2c261c;
    --line-strong: #463a28;

    --ok: #4f9d5d;
    --danger: #c0463f;

    --glow: 0 0 6px rgba(255, 158, 44, 0.55), 0 0 22px rgba(255, 158, 44, 0.3);

    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 24px;
    --space-6: 32px;

    --radius: 4px;
    --radius-lg: 6px;

    --app-min-width: 1024px;
    --app-min-height: 720px;

    --transition: 0.18s ease;
    --font-display: 'Yu Gothic UI', 'Hiragino Kaku Gothic ProN', 'Segoe UI', sans-serif;
    --font-label: 'Consolas', 'SFMono-Regular', 'Courier New', monospace;
    --font-tube: 'Consolas', 'Courier New', monospace;
  }

  :global(*),
  :global(*::before),
  :global(*::after) {
    box-sizing: border-box;
  }

  :global(html),
  :global(body) {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-width: var(--app-min-width);
    min-height: var(--app-min-height);
    background-color: var(--panel);
    color: var(--ink);
    font-family: var(--font-display);
    overflow: hidden;
  }

  :global(.btn) {
    font-size: 14px;
    font-family: var(--font-label);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: var(--space-2) var(--space-5);
    border-radius: var(--radius);
    border: 1px solid var(--amber);
    background-color: var(--amber);
    color: #1a0e00;
    cursor: pointer;
    transition:
      background-color var(--transition),
      color var(--transition);
  }

  :global(.btn:hover) {
    background-color: transparent;
    color: var(--amber);
  }

  :global(.btn:active) {
    background-color: var(--amber-deep);
    border-color: var(--amber-deep);
    color: #1a0e00;
  }

  :global(.btn:disabled) {
    background-color: transparent;
    border-color: var(--line-strong);
    color: var(--ink-dim);
    cursor: not-allowed;
  }

  :global(.btn--ghost) {
    background-color: transparent;
    border-color: var(--line-strong);
    color: var(--ink-dim);
  }

  :global(.btn--ghost:hover) {
    border-color: var(--amber-deep);
    color: var(--ink);
    background-color: transparent;
  }

  :global(.btn--ghost:active) {
    border-color: var(--line-strong);
    color: var(--ink-dim);
    background-color: var(--panel-sunken);
  }

  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    min-width: var(--app-min-width);
    min-height: var(--app-min-height);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }

  h1 {
    font-size: clamp(18px, 2.4vw, 26px);
    font-weight: 700;
    letter-spacing: 0.06em;
    margin: 0;
    color: var(--ink);
  }

  .copyright {
    margin: 0;
    font-family: var(--font-label);
    font-size: 11px;
    color: var(--ink-dim);
    white-space: nowrap;
  }

  .wrapper {
    display: flex;
    align-items: stretch;
    width: 100%;
    flex: 1;
    min-height: 0;
  }

  @media (max-width: 900px) {
    .wrapper {
      flex-direction: column;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(*),
    :global(*::before),
    :global(*::after) {
      transition: none !important;
    }
  }
</style>
