import { createProjectMeta, type ProjectIndex, type ProjectMeta } from '$lib/project';

export const PROJECTS_SCHEMA_VERSION = 1;

type ProjectsPayloadV1 = {
  version: typeof PROJECTS_SCHEMA_VERSION;
  projects: ProjectMeta[];
};

export function serializeProjectIndex(index: ProjectIndex): string {
  const payload: ProjectsPayloadV1 = {
    version: PROJECTS_SCHEMA_VERSION,
    projects: index.projects
  };
  return JSON.stringify(payload);
}

function normalizeProjectMeta(value: unknown): ProjectMeta | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || !record.id) return null;
  if (typeof record.name !== 'string') return null;
  if (typeof record.createdAt !== 'string' || typeof record.lastOpenedAt !== 'string') return null;

  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    lastOpenedAt: record.lastOpenedAt
  };
}

function parseLegacyProjectIndex(record: Record<string, unknown>): ProjectIndex {
  const list = record.projects;
  if (!Array.isArray(list)) return { projects: [] };

  const projects = list
    .map((project) => normalizeProjectMeta(project))
    .filter((project): project is ProjectMeta => project !== null);
  return { projects };
}

export function parseStoredProjectIndex(raw: string | null): ProjectIndex {
  if (!raw) return { projects: [] };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { projects: [] };
    }

    const record = parsed as Record<string, unknown>;
    if (record.version === PROJECTS_SCHEMA_VERSION) {
      return parseLegacyProjectIndex(record);
    }

    return parseLegacyProjectIndex(record);
  } catch {
    return { projects: [] };
  }
}

export { createProjectMeta };
