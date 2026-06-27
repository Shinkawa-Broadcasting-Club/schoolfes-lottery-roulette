import { isTauri } from '@tauri-apps/api/core';
import { APP_NAME } from './appInfo';

async function applyWindowTitle(title: string): Promise<void> {
  if (!isTauri()) {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
    return;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().setTitle(title);
}

export async function setProjectWindowTitle(projectName: string): Promise<void> {
  await applyWindowTitle(`${projectName} - ${APP_NAME}`);
}

export async function resetWindowTitle(): Promise<void> {
  await applyWindowTitle(APP_NAME);
}
