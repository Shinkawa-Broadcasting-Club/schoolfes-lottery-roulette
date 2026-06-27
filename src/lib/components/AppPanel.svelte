<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    backLabel?: string;
    onBack?: () => void;
    onClose?: () => void;
    closeLabel?: string;
    headerActions?: Snippet;
    children: Snippet;
    footer?: Snippet;
    errorMessage?: string;
    contentClass?: string;
    panelClass?: string;
  };

  let {
    title,
    backLabel = '← 戻る',
    onBack,
    onClose,
    closeLabel = '閉じる',
    headerActions,
    children,
    footer,
    errorMessage = '',
    contentClass = '',
    panelClass = ''
  }: Props = $props();
</script>

<div class="app-panel {panelClass}">
  <div class="app-panel__header">
    <div class="app-panel__header-main">
      {#if onBack}
        <button type="button" class="app-panel__back" onclick={onBack}>{backLabel}</button>
      {/if}
      <h2 class="app-panel__title">{title}</h2>
    </div>
    <div class="app-panel__header-actions">
      {#if headerActions}
        {@render headerActions()}
      {/if}
      {#if onClose}
        <button type="button" class="btn btn--ghost app-panel__close" onclick={onClose}>
          {closeLabel}
        </button>
      {/if}
    </div>
  </div>

  <div class="app-panel__body {contentClass}">
    {@render children()}
  </div>

  {#if errorMessage}
    <p class="app-panel__error text-danger">{errorMessage}</p>
  {/if}

  {#if footer}
    <div class="app-panel__footer">
      {@render footer()}
    </div>
  {/if}
</div>
