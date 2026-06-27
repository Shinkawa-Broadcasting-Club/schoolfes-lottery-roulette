import {
  deleteProjectStorage,
  loadProjectStorageItem,
  saveGlobalFile,
  saveProjectStorageItem
} from '$lib/appStorage';
import {
  createDefaultSettings,
  createEmptyResults,
  parseStoredResults,
  parseStoredSettings,
  serializeResults,
  serializeSettings,
  SETTINGS_STORAGE_KEY,
  RESULTS_STORAGE_KEY,
  type LotteryResults,
  type LotterySettings
} from '$lib/lottery';
import {
  createProjectMeta,
  PROJECTS_INDEX_FILE,
  serializeProjectIndex,
  type ProjectMeta
} from '$lib/project';
import { resetWindowTitle, setProjectWindowTitle } from '$lib/windowTitle';

export type ProjectSession = {
  projectId: string | null;
  projectName: string;
  storageReady: boolean;
};

export type ProjectManagerDeps = {
  getProjectsIndex: () => ProjectMeta[];
  setProjectsIndex: (projects: ProjectMeta[]) => void;
  getSession: () => ProjectSession;
  setSession: (session: Partial<ProjectSession>) => void;
  applySettings: (settings: LotterySettings) => void;
  setResults: (results: LotteryResults) => void;
  resetLotteryView: () => void;
};

export function createProjectManager(deps: ProjectManagerDeps) {
  async function saveProjectsIndex() {
    const projects = deps.getProjectsIndex();
    await saveGlobalFile(PROJECTS_INDEX_FILE, serializeProjectIndex({ projects }));
  }

  async function loadProjectSettings(projectId: string): Promise<LotterySettings> {
    const settingsRaw = await loadProjectStorageItem(projectId, SETTINGS_STORAGE_KEY);
    return parseStoredSettings(settingsRaw) ?? createDefaultSettings();
  }

  async function loadProjectResults(
    projectId: string,
    prizeNames: LotterySettings['prizes']
  ): Promise<LotteryResults> {
    const resultsRaw = await loadProjectStorageItem(projectId, RESULTS_STORAGE_KEY);
    return parseStoredResults(resultsRaw, prizeNames) ?? createEmptyResults(prizeNames);
  }

  async function updateProjectLastOpened(project: ProjectMeta) {
    project.lastOpenedAt = new Date().toISOString();
    deps.setProjectsIndex([...deps.getProjectsIndex()]);
    await saveProjectsIndex();
  }

  async function openProject(projectId: string) {
    const project = deps.getProjectsIndex().find((entry) => entry.id === projectId);
    if (!project) return;

    deps.setSession({ storageReady: false });

    const settings = await loadProjectSettings(projectId);
    deps.applySettings(settings);
    deps.setResults(await loadProjectResults(projectId, settings.prizes));

    await updateProjectLastOpened(project);

    deps.setSession({
      projectId,
      projectName: project.name,
      storageReady: true
    });
    deps.resetLotteryView();
    await setProjectWindowTitle(project.name);
  }

  async function createProject(name: string) {
    const meta = createProjectMeta(name);
    const defaultSets = createDefaultSettings();

    await saveProjectStorageItem(meta.id, SETTINGS_STORAGE_KEY, serializeSettings(defaultSets));
    await saveProjectStorageItem(
      meta.id,
      RESULTS_STORAGE_KEY,
      serializeResults(createEmptyResults(defaultSets.prizes))
    );

    deps.setProjectsIndex([...deps.getProjectsIndex(), meta]);
    await saveProjectsIndex();
    await openProject(meta.id);
  }

  async function deleteProject(projectId: string) {
    const session = deps.getSession();
    if (session.projectId === projectId) {
      await closeProject();
    }
    await deleteProjectStorage(projectId);
    deps.setProjectsIndex(deps.getProjectsIndex().filter((entry) => entry.id !== projectId));
    await saveProjectsIndex();
  }

  async function renameProject(projectId: string, newName: string) {
    const project = deps.getProjectsIndex().find((entry) => entry.id === projectId);
    if (!project) return;

    project.name = newName;
    deps.setProjectsIndex([...deps.getProjectsIndex()]);
    await saveProjectsIndex();

    const session = deps.getSession();
    if (session.projectId === projectId) {
      deps.setSession({ projectName: newName });
      await setProjectWindowTitle(newName);
    }
  }

  async function closeProject() {
    const defaultSettings = createDefaultSettings();
    deps.setSession({ storageReady: false, projectId: null, projectName: '' });
    deps.resetLotteryView();
    deps.applySettings(defaultSettings);
    deps.setResults(createEmptyResults(defaultSettings.prizes));
    await resetWindowTitle();
  }

  return {
    openProject,
    createProject,
    deleteProject,
    renameProject,
    closeProject
  };
}

export type ProjectManager = ReturnType<typeof createProjectManager>;
