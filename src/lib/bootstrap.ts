import { loadGlobalFile } from '$lib/appStorage';
import { parseStoredProjectIndex } from '$lib/storage/projectsStorage';
import { PROJECTS_INDEX_FILE } from '$lib/storage/storageKeys';
import type { ProjectMeta } from '$lib/project';

export type BootstrapState = {
  projects: ProjectMeta[];
};

export async function bootstrapApp(): Promise<BootstrapState> {
  const indexRaw = await loadGlobalFile(PROJECTS_INDEX_FILE);
  return parseStoredProjectIndex(indexRaw);
}
