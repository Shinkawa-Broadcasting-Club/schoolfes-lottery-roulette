export const SETTINGS_STORAGE_KEY = 'sbc-lottery-roulette-settings-v1';
export const RESULTS_STORAGE_KEY = 'sbc-lottery-roulette-results-v1';

export const SETTINGS_STORAGE_FILE = 'settings.json';
export const RESULTS_STORAGE_FILE = 'results.json';
export const PROJECTS_INDEX_FILE = 'projects.json';

export const PROJECT_STORAGE_KEYS = [SETTINGS_STORAGE_KEY, RESULTS_STORAGE_KEY] as const;
export type ProjectStorageKey = (typeof PROJECT_STORAGE_KEYS)[number];

export const GLOBAL_STORAGE_FILES = [PROJECTS_INDEX_FILE] as const;

export const STORAGE_KEY_TO_FILENAME = {
  [SETTINGS_STORAGE_KEY]: SETTINGS_STORAGE_FILE,
  [RESULTS_STORAGE_KEY]: RESULTS_STORAGE_FILE
} as const satisfies Record<ProjectStorageKey, string>;

export type AppStorageKey = keyof typeof STORAGE_KEY_TO_FILENAME;
