<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  export type DialogKind = 'alert' | 'confirm' | 'prompt';

  type Props = {
    visible: boolean;
    kind: DialogKind;
    message: string;
    input?: string;
    onConfirm: () => void;
    onCancel: () => void;
  };

  let {
    visible,
    kind,
    message,
    input = $bindable(''),
    onConfirm,
    onCancel
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (!visible) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm();
    }
  }

  function selectPromptInput(e: FocusEvent) {
    if (e.currentTarget instanceof HTMLInputElement) {
      e.currentTarget.select();
    }
  }

  const focusPromptInput: Attachment<HTMLInputElement> = (inputElement) => {
    inputElement.focus();
    inputElement.select();
  };

  $effect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
  <div class="dialog-overlay">
    <button
      type="button"
      class="overlay-backdrop"
      aria-label="ダイアログを閉じる"
      onclick={onCancel}
    ></button>
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-message"
      tabindex="-1"
    >
      <p id="dialog-message" class="dialog-message">{message}</p>
      {#if kind === 'prompt'}
        <input
          type="text"
          class="field field--tube field--full"
          bind:value={input}
          onfocus={selectPromptInput}
          {@attach focusPromptInput}
        />
      {/if}
      <div class="dialog-actions">
        {#if kind !== 'alert'}
          <button type="button" class="btn btn--ghost" onclick={onCancel}>キャンセル</button>
        {/if}
        <button type="button" class="btn" onclick={onConfirm}>OK</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .dialog {
    position: relative;
    z-index: 1;
    width: min(calc(100% - var(--space-4) * 2), 420px);
    padding: var(--space-4);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--panel-raised);
  }

  .dialog :global(.field) {
    margin: 0 0 var(--space-3);
  }

  .dialog-message {
    margin: 0;
    padding: 0 0 var(--space-3);
    font-size: 15px;
    line-height: 1.6;
    color: var(--ink);
    white-space: pre-wrap;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
