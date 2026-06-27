<script lang="ts">
  import AppDialog from '$lib/components/AppDialog.svelte';
  import {
    formatProjectDate,
    generateDefaultProjectName,
    sortProjectsByLastOpened,
    type ProjectMeta
  } from '$lib/project';

  type Props = {
    projects: ProjectMeta[];
    onOpen: (projectId: string) => void;
    onCreateNew: (name: string) => void;
    onDelete: (projectId: string) => void;
    onRename: (projectId: string, newName: string) => void;
  };

  let { projects, onOpen, onCreateNew, onDelete, onRename }: Props = $props();

  let sorted = $derived(sortProjectsByLastOpened(projects));

  let newProjectDialogVisible = $state(false);
  let newProjectName = $state('');

  let deleteConfirmVisible = $state(false);
  let deleteTargetId = $state('');
  let deleteTargetName = $state('');
  let deleteMessage = $derived(`「${deleteTargetName}」を削除しますか？\nこの操作は取り消せません。`);

  let renameDialogVisible = $state(false);
  let renameTargetId = $state('');
  let renameValue = $state('');

  function openNewProjectDialog() {
    newProjectName = generateDefaultProjectName();
    newProjectDialogVisible = true;
  }

  function confirmNewProject() {
    const name = newProjectName.trim();
    if (!name) return;
    newProjectDialogVisible = false;
    onCreateNew(name);
  }

  function cancelNewProject() {
    newProjectDialogVisible = false;
  }

  function requestDelete(project: ProjectMeta) {
    deleteTargetId = project.id;
    deleteTargetName = project.name;
    deleteConfirmVisible = true;
  }

  function confirmDelete() {
    deleteConfirmVisible = false;
    onDelete(deleteTargetId);
    deleteTargetId = '';
    deleteTargetName = '';
  }

  function cancelDelete() {
    deleteConfirmVisible = false;
  }

  function requestRename(project: ProjectMeta) {
    renameTargetId = project.id;
    renameValue = project.name;
    renameDialogVisible = true;
  }

  function confirmRename() {
    const name = renameValue.trim();
    if (!name) return;
    renameDialogVisible = false;
    onRename(renameTargetId, name);
    renameTargetId = '';
    renameValue = '';
  }

  function cancelRename() {
    renameDialogVisible = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="project-selector">
  <div class="selector-header">
    <h2 class="selector-title">ようこそ</h2>
    <button type="button" class="btn" onclick={openNewProjectDialog}>新規作成</button>
  </div>

  <div class="project-list">
    {#if sorted.length === 0}
      <div class="empty-state">
        <p class="empty-message">プロジェクトがありません</p>
        <p class="empty-hint text-dim">「新規作成」ボタンからプロジェクトを作成してください</p>
      </div>
    {:else}
      {#each sorted as project (project.id)}
        <div class="project-row surface">
          <button
            type="button"
            class="project-open-area"
            ondblclick={() => onOpen(project.id)}
            onclick={() => onOpen(project.id)}
          >
            <span class="project-name">{project.name}</span>
            <span class="project-dates text-dim">
              最終使用: {formatProjectDate(project.lastOpenedAt)}
            </span>
          </button>
          <div class="project-actions">
            <button
              type="button"
              class="btn btn--ghost project-action-btn"
              onclick={() => requestRename(project)}
            >
              名前変更
            </button>
            <button
              type="button"
              class="btn btn--ghost project-action-btn project-delete-btn"
              onclick={() => requestDelete(project)}
            >
              削除
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<AppDialog
  visible={newProjectDialogVisible}
  kind="prompt"
  message="プロジェクト名を入力してください"
  bind:input={newProjectName}
  onConfirm={confirmNewProject}
  onCancel={cancelNewProject}
/>

<AppDialog
  visible={deleteConfirmVisible}
  kind="confirm"
  message={deleteMessage}
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
/>

<AppDialog
  visible={renameDialogVisible}
  kind="prompt"
  message="新しい名前を入力してください"
  bind:input={renameValue}
  onConfirm={confirmRename}
  onCancel={cancelRename}
/>

<style>
  .project-selector {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: var(--space-4) max(var(--space-4), calc(50% - 320px));
    background: var(--panel-raised);
    overflow: hidden;
  }

  .selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding-bottom: var(--space-3);
    flex-shrink: 0;
  }

  .selector-title {
    margin: 0;
    color: var(--ink);
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .project-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-top: var(--space-3);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
    padding-top: var(--space-4);
  }

  .empty-message {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 700;
    color: var(--ink);
  }

  .empty-hint {
    margin: 0;
    font-size: var(--text-base);
  }

  .project-row {
    display: flex;
    align-items: stretch;
    gap: 0;
  }

  .project-open-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
    padding: var(--space-3);
    background: transparent;
    border: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .project-open-area:hover {
    background: var(--line);
  }

  .project-name {
    font-size: var(--text-md);
    font-weight: 700;
    color: var(--ink);
  }

  .project-dates {
    font-family: var(--font-label);
    font-size: var(--text-sm);
  }

  .project-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2);
    background: var(--panel);
    flex-shrink: 0;
  }

  .project-action-btn {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-sm);
    height: 28px;
  }

  .project-delete-btn {
    color: var(--danger);
  }

  .project-delete-btn:hover {
    background: var(--panel-sunken);
  }
</style>
