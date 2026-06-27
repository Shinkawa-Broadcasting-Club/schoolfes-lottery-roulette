import { invoke, isTauri } from '@tauri-apps/api/core';
import { RESULTS_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './lottery';

export const SETTINGS_STORAGE_FILE = 'settings.json';
export const RESULTS_STORAGE_FILE = 'results.json';

const STORAGE_FILES = {
  [SETTINGS_STORAGE_KEY]: SETTINGS_STORAGE_FILE,
  [RESULTS_STORAGE_KEY]: RESULTS_STORAGE_FILE
} as const;

export type AppStorageKey = keyof typeof STORAGE_FILES;

async function readFromAppData(filename: string): Promise<string | null> {
  return invoke<string | null>('read_app_storage', { filename });
}

async function writeToAppData(filename: string, content: string): Promise<void> {
  await invoke('write_app_storage', { filename, content });
}

function readFromLocalStorage(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

function writeToLocalStorage(key: string, content: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, content);
}

function migrateLegacyLocalStorage(key: AppStorageKey): string | null {
  const legacy = readFromLocalStorage(key);
  if (legacy === null) return null;

  localStorage.removeItem(key);
  return legacy;
}

export async function loadStorageItem(key: AppStorageKey): Promise<string | null> {
  if (isTauri()) {
    const filename = STORAGE_FILES[key];
    const stored = await readFromAppData(filename);
    if (stored !== null) return stored;

    const legacy = migrateLegacyLocalStorage(key);
    if (legacy !== null) {
      await writeToAppData(filename, legacy);
    }
    return legacy;
  }

  return readFromLocalStorage(key);
}

export async function saveStorageItem(key: AppStorageKey, content: string): Promise<void> {
  if (isTauri()) {
    await writeToAppData(STORAGE_FILES[key], content);
    return;
  }

  writeToLocalStorage(key, content);
}
