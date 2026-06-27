import { saveProjectStorageItem } from '$lib/appStorage';
import {
  type DigitRevealOrder,
  type LotteryResults,
  type LotterySettings,
  type PrizeName,
  serializeResults,
  serializeSettings
} from '$lib/lottery';
import { RESULTS_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '$lib/storage/storageKeys';
import { applyTheme, persistThemeChoice, type AppTheme } from '$lib/theme';
import { debounceAsync } from '$lib/utils/debounce';

export const SAVE_DEBOUNCE_MS = 300;

type SettingsSnapshot = {
  prizes: PrizeName[];
  digitRevealOrder: DigitRevealOrder;
  theme: AppTheme;
};

export function createAutoSaveHandlers(getProjectId: () => string | null) {
  const saveSettings = debounceAsync(async (snapshot: SettingsSnapshot) => {
    const projectId = getProjectId();
    if (!projectId) return;

    const settings: LotterySettings = {
      prizes: snapshot.prizes,
      digitRevealOrder: snapshot.digitRevealOrder,
      theme: snapshot.theme
    };
    await saveProjectStorageItem(projectId, SETTINGS_STORAGE_KEY, serializeSettings(settings));
  }, SAVE_DEBOUNCE_MS);

  const saveResults = debounceAsync(async (results: LotteryResults) => {
    const projectId = getProjectId();
    if (!projectId) return;
    await saveProjectStorageItem(projectId, RESULTS_STORAGE_KEY, serializeResults(results));
  }, SAVE_DEBOUNCE_MS);

  return { saveSettings, saveResults };
}

export function applyThemeWithPersistence(theme: AppTheme): void {
  applyTheme(theme);
  persistThemeChoice(theme);
}
