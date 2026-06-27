import { bootstrapApp } from '$lib/bootstrap';
import type { ProjectMeta } from '$lib/project';

let projectsIndex = $state<ProjectMeta[]>([]);
let globalStateReady = $state(false);

export function getProjectsIndex(): ProjectMeta[] {
  return projectsIndex;
}

export function setProjectsIndex(projects: ProjectMeta[]): void {
  projectsIndex = projects;
}

export function isGlobalStateReady(): boolean {
  return globalStateReady;
}

export async function initAppState(): Promise<void> {
  const state = await bootstrapApp();
  projectsIndex = state.projects;
  globalStateReady = true;
}
