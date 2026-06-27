import { invoke } from '@tauri-apps/api/core';

export const TAURI_COMMANDS = {
  readAppStorage: 'read_app_storage',
  writeAppStorage: 'write_app_storage',
  readProjectStorage: 'read_project_storage',
  writeProjectStorage: 'write_project_storage',
  deleteProjectDir: 'delete_project_dir'
} as const;

export async function readAppStorage(filename: string): Promise<string | null> {
  return invoke<string | null>(TAURI_COMMANDS.readAppStorage, { filename });
}

export async function writeAppStorage(filename: string, content: string): Promise<void> {
  await invoke(TAURI_COMMANDS.writeAppStorage, { filename, content });
}

export async function readProjectStorage(
  projectId: string,
  filename: string
): Promise<string | null> {
  return invoke<string | null>(TAURI_COMMANDS.readProjectStorage, { projectId, filename });
}

export async function writeProjectStorage(
  projectId: string,
  filename: string,
  content: string
): Promise<void> {
  await invoke(TAURI_COMMANDS.writeProjectStorage, { projectId, filename, content });
}

export async function deleteProjectDir(projectId: string): Promise<void> {
  await invoke(TAURI_COMMANDS.deleteProjectDir, { projectId });
}
