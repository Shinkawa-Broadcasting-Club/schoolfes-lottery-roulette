import { isTauri } from '@tauri-apps/api/core';
import {
  deleteProjectDir,
  readAppStorage,
  readProjectStorage,
  writeAppStorage,
  writeProjectStorage
} from './tauri/commands';
import {
  PROJECTS_INDEX_FILE,
  RESULTS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  STORAGE_KEY_TO_FILENAME,
  type AppStorageKey
} from './storage/storageKeys';

export { RESULTS_STORAGE_FILE, SETTINGS_STORAGE_FILE } from './storage/storageKeys';

export type { AppStorageKey };

const PROJECT_LOCALSTORAGE_PREFIX = 'project:';
const GLOBAL_LOCALSTORAGE_PREFIX = 'global:';

export class AppStorageError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AppStorageError';
    this.cause = cause;
  }
}

async function withStorageError<T>(operation: () => Promise<T>, context: string): Promise<T> {
  try {
    return await operation();
  } catch (cause) {
    throw new AppStorageError(`${context}: ${String(cause)}`, cause);
  }
}

function resolveStorageFilename(key: AppStorageKey): string {
  return STORAGE_KEY_TO_FILENAME[key];
}

function readFromLocalStorage(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

function writeToLocalStorage(key: string, content: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, content);
}

function removeFromLocalStorage(key: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(key);
}

function getProjectLocalStorageKey(projectId: string, key: AppStorageKey): string {
  return `${PROJECT_LOCALSTORAGE_PREFIX}${projectId}:${key}`;
}

function getGlobalLocalStorageKey(filename: string): string {
  return `${GLOBAL_LOCALSTORAGE_PREFIX}${filename}`;
}

async function readProjectFile(projectId: string, key: AppStorageKey): Promise<string | null> {
  return readProjectStorage(projectId, resolveStorageFilename(key));
}

async function writeProjectFile(
  projectId: string,
  key: AppStorageKey,
  content: string
): Promise<void> {
  await writeProjectStorage(projectId, resolveStorageFilename(key), content);
}

export async function loadProjectStorageItem(
  projectId: string,
  key: AppStorageKey
): Promise<string | null> {
  return withStorageError(async () => {
    if (isTauri()) {
      return readProjectFile(projectId, key);
    }
    return readFromLocalStorage(getProjectLocalStorageKey(projectId, key));
  }, `loadProjectStorageItem(${projectId}, ${key})`);
}

export async function saveProjectStorageItem(
  projectId: string,
  key: AppStorageKey,
  content: string
): Promise<void> {
  await withStorageError(async () => {
    if (isTauri()) {
      await writeProjectFile(projectId, key, content);
      return;
    }
    writeToLocalStorage(getProjectLocalStorageKey(projectId, key), content);
  }, `saveProjectStorageItem(${projectId}, ${key})`);
}

export async function deleteProjectStorage(projectId: string): Promise<void> {
  await withStorageError(async () => {
    if (isTauri()) {
      await deleteProjectDir(projectId);
      return;
    }
    removeFromLocalStorage(getProjectLocalStorageKey(projectId, SETTINGS_STORAGE_KEY));
    removeFromLocalStorage(getProjectLocalStorageKey(projectId, RESULTS_STORAGE_KEY));
  }, `deleteProjectStorage(${projectId})`);
}

export async function loadGlobalFile(filename: string): Promise<string | null> {
  return withStorageError(async () => {
    if (isTauri()) {
      return readAppStorage(filename);
    }
    return readFromLocalStorage(getGlobalLocalStorageKey(filename));
  }, `loadGlobalFile(${filename})`);
}

export async function saveGlobalFile(filename: string, content: string): Promise<void> {
  await withStorageError(async () => {
    if (isTauri()) {
      await writeAppStorage(filename, content);
      return;
    }
    writeToLocalStorage(getGlobalLocalStorageKey(filename), content);
  }, `saveGlobalFile(${filename})`);
}
