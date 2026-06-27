import {
  getDigitRevealSequence,
  getUsedNumbers,
  hasDuplicateResult,
  LOTTERY_MAX_NUMBER,
  LOTTERY_MIN_NUMBER,
  parseThreeDigitNumber,
  pickAvailableNumber,
  reconcileResultsForPrizes,
  type DigitRevealOrder,
  type LotteryResults,
  type PrizeName
} from '$lib/lottery';
import type { DialogService } from '$lib/services/dialogService.svelte';

const VALIDATION_MESSAGES = {
  NO_PRIZE: '抽選名を選択してください',
  INVALID_RANGE: '最小値と最大値は0〜999の整数で入力してください',
  INVALID_NUMBER: '0〜999の整数を入力してください',
  DUPLICATE_NUMBER: 'その番号はすでに当選済みです',
  NO_AVAILABLE_NUMBER: '指定した範囲に未当選番号がありません',
  CONFIRM_DELETE: '次の番号を削除しますか？'
} as const;

export type LotteryControllerDeps = {
  dialog: DialogService;
  getPrizes: () => readonly PrizeName[];
  getResults: () => LotteryResults;
  setResults: (results: LotteryResults) => void;
  getSelectedPrize: () => PrizeName | '';
  getMinValue: () => string;
  getMaxValue: () => string;
  setSelectedPrize: (prize: PrizeName | '') => void;
  setPrizes: (prizes: PrizeName[]) => void;
  onDrawStart: () => void;
  onDrawComplete: (prizeName: PrizeName, number: number) => Promise<void>;
};

export function createLotteryController(deps: LotteryControllerDeps) {
  function validateNumber(value: string | number): number | null {
    return parseThreeDigitNumber(value, LOTTERY_MIN_NUMBER, LOTTERY_MAX_NUMBER);
  }

  async function validateInput(): Promise<{ prizeName: PrizeName; min: number; max: number } | null> {
    const prizeName = deps.getSelectedPrize();
    const min = validateNumber(deps.getMinValue());
    const max = validateNumber(deps.getMaxValue());
    const prizes = deps.getPrizes();

    if (!prizeName) {
      await deps.dialog.showAlert(VALIDATION_MESSAGES.NO_PRIZE);
      return null;
    }
    if (min === null || max === null || min > max) {
      await deps.dialog.showAlert(VALIDATION_MESSAGES.INVALID_RANGE);
      return null;
    }
    return { prizeName, min, max };
  }

  async function addToSection(sectionName: PrizeName, number: number): Promise<boolean> {
    const prizes = deps.getPrizes();
    const results = deps.getResults();
    if (hasDuplicateResult(results, number, prizes)) {
      await deps.dialog.showAlert(VALIDATION_MESSAGES.DUPLICATE_NUMBER);
      return false;
    }
    deps.setResults({
      ...results,
      [sectionName]: [...results[sectionName], number]
    });
    return true;
  }

  async function editNumber(sectionName: PrizeName, index: number) {
    const prizes = deps.getPrizes();
    const results = deps.getResults();
    const currentNumber = results[sectionName][index];
    const newNumber = await deps.dialog.showPrompt(
      '新しい番号を入力してください:',
      String(currentNumber)
    );
    if (newNumber === null || newNumber === '') return;

    const validNumber = validateNumber(newNumber);
    if (validNumber === null) {
      await deps.dialog.showAlert(VALIDATION_MESSAGES.INVALID_NUMBER);
      return;
    }
    if (hasDuplicateResult(results, validNumber, prizes, { sectionName, index })) {
      await deps.dialog.showAlert(VALIDATION_MESSAGES.DUPLICATE_NUMBER);
      return;
    }
    deps.setResults({
      ...results,
      [sectionName]: results[sectionName].map((value, i) => (i === index ? validNumber : value))
    });
  }

  async function deleteNumber(sectionName: PrizeName, index: number) {
    const results = deps.getResults();
    const targetNumber = results[sectionName][index];
    const confirmMessage = `${VALIDATION_MESSAGES.CONFIRM_DELETE}\n${sectionName}: ${targetNumber}`;
    if (await deps.dialog.showConfirm(confirmMessage)) {
      deps.setResults({
        ...results,
        [sectionName]: results[sectionName].filter((_, i) => i !== index)
      });
    }
  }

  async function addManually(sectionName: PrizeName) {
    const number = await deps.dialog.showPrompt(`${sectionName}に追加する番号を入力してください:`);
    if (number === null || number === '') return;

    const validNumber = validateNumber(number);
    if (validNumber === null) {
      await deps.dialog.showAlert(VALIDATION_MESSAGES.INVALID_NUMBER);
      return;
    }
    await addToSection(sectionName, validNumber);
  }

  async function generateRandomNumber() {
    const validation = await validateInput();
    if (!validation) return;

    const { prizeName, min, max } = validation;
    const prizes = deps.getPrizes();
    const results = deps.getResults();
    const randomNumber = pickAvailableNumber(min, max, getUsedNumbers(results, prizes));

    if (randomNumber === null) {
      await deps.dialog.showAlert(VALIDATION_MESSAGES.NO_AVAILABLE_NUMBER);
      return;
    }

    deps.onDrawStart();
    await deps.onDrawComplete(prizeName, randomNumber);
  }

  function handlePrizesChange(nextPrizes: PrizeName[]) {
    const previousPrizes = [...deps.getPrizes()];
    deps.setPrizes(nextPrizes);
    deps.setResults(reconcileResultsForPrizes(previousPrizes, nextPrizes, deps.getResults()));

    const selectedPrize = deps.getSelectedPrize();
    if (selectedPrize && !nextPrizes.includes(selectedPrize)) {
      deps.setSelectedPrize('');
    }
  }

  function handleDigitRevealOrderChange(_order: DigitRevealOrder) {
    /* wired in page state */
  }

  return {
    addManually,
    editNumber,
    deleteNumber,
    generateRandomNumber,
    addToSection,
    handlePrizesChange,
    handleDigitRevealOrderChange,
    getDigitRevealSequence
  };
}

export type LotteryController = ReturnType<typeof createLotteryController>;

export { VALIDATION_MESSAGES };
