<script lang="ts">
  import {
    createDefaultPrizes,
    MAX_PRIZE_COUNT,
    normalizePrizeName,
    type PrizeName
  } from '$lib/lottery';

  type Props = {
    visible: boolean;
    prizes: readonly PrizeName[];
    onApply: (prizes: PrizeName[]) => void;
    onClose: () => void;
  };

  let { visible, prizes, onApply, onClose }: Props = $props();

  let draftPrizes = $state<PrizeName[]>([]);
  let errorMessage = $state('');

  $effect(() => {
    if (!visible) return;
    draftPrizes = prizes.length > 0 ? [...prizes] : createDefaultPrizes();
    errorMessage = '';
  });

  function updatePrize(index: number, value: string) {
    draftPrizes[index] = value;
    draftPrizes = [...draftPrizes];
    errorMessage = '';
  }

  function addPrize() {
    if (draftPrizes.length >= MAX_PRIZE_COUNT) return;
    draftPrizes = [...draftPrizes, `${draftPrizes.length + 1}等`];
    errorMessage = '';
  }

  function removePrize(index: number) {
    if (draftPrizes.length <= 1) return;
    draftPrizes = draftPrizes.filter((_, i) => i !== index);
    errorMessage = '';
  }

  function resetToDefault() {
    draftPrizes = createDefaultPrizes();
    errorMessage = '';
  }

  function applySettings() {
    const normalized = draftPrizes.map(normalizePrizeName);
    if (normalized.some((name) => !name)) {
      errorMessage = '等級名を空にはできません';
      return;
    }

    if (new Set(normalized).size !== normalized.length) {
      errorMessage = '同じ等級名は使用できません';
      return;
    }

    if (normalized.length > MAX_PRIZE_COUNT) {
      errorMessage = `等級は最大${MAX_PRIZE_COUNT}個までです`;
      return;
    }

    onApply(normalized);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!visible) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      applySettings();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
  <div class="settings-overlay">
    <button
      type="button"
      class="settings-backdrop"
      aria-label="設定を閉じる"
      onclick={onClose}
    ></button>
    <div class="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="settings-header">
        <div>
          <h2 id="settings-title">設定</h2>
          <p>使用する等級と表示名を設定します。最大{MAX_PRIZE_COUNT}個まで作成できます。</p>
        </div>
        <button type="button" class="btn btn--ghost settings-close" onclick={onClose}>閉じる</button>
      </div>

      <div class="settings-list" aria-label="等級リスト">
        {#each draftPrizes as prize, index (`${index}-${draftPrizes.length}`)}
          <div class="settings-row">
            <span class="settings-index">{index + 1}</span>
            <label>
              <span>等級名</span>
              <input
                type="text"
                value={prize}
                maxlength="24"
                oninput={(e) => updatePrize(index, e.currentTarget.value)}
              />
            </label>
            <button
              type="button"
              class="btn btn--ghost settings-remove"
              disabled={draftPrizes.length <= 1}
              onclick={() => removePrize(index)}
            >
              削除
            </button>
          </div>
        {/each}
      </div>

      {#if errorMessage}
        <p class="settings-error">{errorMessage}</p>
      {/if}

      <div class="settings-actions">
        <button type="button" class="btn btn--ghost" onclick={resetToDefault}>デフォルトに戻す</button>
        <button
          type="button"
          class="btn btn--ghost"
          disabled={draftPrizes.length >= MAX_PRIZE_COUNT}
          onclick={addPrize}
        >
          等級を追加
        </button>
        <button type="button" class="btn" onclick={applySettings}>設定を反映</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .settings-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    justify-content: flex-end;
    padding: 0;
  }

  .settings-backdrop {
    position: absolute;
    inset: 0;
    border: none;
    padding: 0;
    background: rgba(8, 6, 4, 0.72);
    cursor: default;
  }

  .settings-panel {
    position: relative;
    z-index: 1;
    width: min(100%, 520px);
    height: 100%;
    min-height: var(--app-min-height);
    padding: var(--space-3);
    border-left: 1px solid var(--line-strong);
    background: var(--panel-raised);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    overflow: hidden;
  }

  .settings-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }

  h2,
  p {
    margin: 0;
  }

  h2 {
    color: var(--amber);
    font-size: 20px;
    letter-spacing: 0.06em;
  }

  p {
    margin-top: var(--space-1);
    color: var(--ink-dim);
    font-size: 12px;
    line-height: 1.45;
  }

  .settings-close {
    flex-shrink: 0;
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding-right: 0;
  }

  .settings-row {
    display: grid;
    grid-template-columns: 34px 1fr auto;
    align-items: end;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--panel-sunken);
  }

  .settings-index {
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    color: var(--amber);
    font-family: var(--font-label);
    font-weight: 700;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--ink-dim);
    font-family: var(--font-label);
    font-size: 11px;
    letter-spacing: 0.08em;
  }

  input {
    width: 100%;
    font-size: 14px;
    font-family: var(--font-display);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius);
    border: 1px solid var(--line-strong);
    background-color: var(--panel);
    color: var(--ink);
  }

  input:focus {
    outline: none;
    border-color: var(--amber);
  }

  .settings-remove {
    height: 32px;
    padding-inline: var(--space-2);
  }

  .settings-error {
    margin: 0;
    color: var(--danger);
    font-weight: 700;
  }

  .settings-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-1);
    padding-top: var(--space-2);
    border-top: 1px solid var(--line);
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .settings-panel {
      width: 100%;
    }

    .settings-row {
      grid-template-columns: 34px 1fr;
    }

    .settings-remove {
      grid-column: 2;
      justify-self: end;
    }
  }
</style>
