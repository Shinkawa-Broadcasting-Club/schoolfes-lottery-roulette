export type ProjectMeta = {
  id: string;
  name: string;
  createdAt: string;
  lastOpenedAt: string;
};

export type ProjectIndex = {
  projects: ProjectMeta[];
};

export { PROJECTS_INDEX_FILE } from './storage/storageKeys';
export { THEME_LOCALSTORAGE_KEY as LAST_THEME_LOCALSTORAGE_KEY } from './theme';
export {
  parseStoredProjectIndex as parseProjectIndex,
  serializeProjectIndex
} from './storage/projectsStorage';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function parseIsoTime(iso: string): number {
  const timestamp = new Date(iso).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function generateProjectId(): string {
  return Date.now().toString(36);
}

export function generateDefaultProjectName(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate()),
    pad2(now.getHours()),
    pad2(now.getMinutes()),
    pad2(now.getSeconds())
  ].join('-');
}

export function createProjectMeta(name?: string): ProjectMeta {
  const now = new Date().toISOString();
  return {
    id: generateProjectId(),
    name: name ?? generateDefaultProjectName(),
    createdAt: now,
    lastOpenedAt: now
  };
}

export function sortProjectsByLastOpened(projects: readonly ProjectMeta[]): ProjectMeta[] {
  return [...projects].sort((a, b) => parseIsoTime(b.lastOpenedAt) - parseIsoTime(a.lastOpenedAt));
}

export function formatProjectDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
