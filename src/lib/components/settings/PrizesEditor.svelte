<script lang="ts">
  import {
    createDefaultSettings,
    MAX_PRIZE_COUNT,
    normalizePrizeName,
    type PrizeName
  } from '$lib/lottery';

  type DraftPrizeItem = {
    id: string;
    name: PrizeName;
  };

  type Props = {
    prizes: readonly PrizeName[];
    onPrizesChange: (prizes: PrizeName[]) => void;
    onError: (message: string) => void;
  };

  let { prizes, onPrizesChange, onError }: Props = $props();

  let draftPrizes = $state<DraftPrizeItem[]>([]);
  let draggingFrom = $state<number | null>(null);
  let draftIdCounter = 0;

  function createDraftItem(name: PrizeName): DraftPrizeItem {
    draftIdCounter += 1;
    return { id: `draft-${draftIdCounter}`, name };
  }

  function toDraftItems(names: readonly PrizeName[]): DraftPrizeItem[] {
    draftIdCounter = 0;
    return names.map((name) => createDraftItem(name));
  }

  $effect(() => {
    draftPrizes =
      prizes.length > 0 ? toDraftItems(prizes) : toDraftItems(createDefaultSettings().prizes);
  });

  function normalizeDraftPrizes(): PrizeName[] | null {
    const normalized = draftPrizes.map((item) => normalizePrizeName(item.name));
    if (normalized.some((name) => !name)) {
      onError('等級名を空にはできません');
      return null;
    }
    if (new Set(normalized).size !== normalized.length) {
      onError('同じ等級名は使用できません');
      return null;
    }
    if (normalized.length > MAX_PRIZE_COUNT) {
      onError(`等級は最大${MAX_PRIZE_COUNT}個までです`);
      return null;
    }
    onError('');
    return normalized;
  }

  function commitPrizes() {
    const normalized = normalizeDraftPrizes();
    if (!normalized) {
      draftPrizes = toDraftItems(prizes);
      return;
    }
    onPrizesChange(normalized);
    draftPrizes = toDraftItems(normalized);
  }

  function updatePrize(index: number, value: string) {
    draftPrizes[index].name = value;
    draftPrizes = [...draftPrizes];
    onError('');
  }

  function addPrize() {
    if (draftPrizes.length >= MAX_PRIZE_COUNT) return;
    draftPrizes = [...draftPrizes, createDraftItem(`${draftPrizes.length + 1}等`)];
    commitPrizes();
  }

  function removePrize(index: number) {
    if (draftPrizes.length <= 1) return;
    draftPrizes = draftPrizes.filter((_, i) => i !== index);
    commitPrizes();
  }

  function reorderPrize(from: number, to: number) {
    if (from === to) return;
    const next = [...draftPrizes];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    draftPrizes = next;
    onError('');
  }

  function startDrag(index: number, e: PointerEvent) {
    if (e.button !== 0) return;

    draggingFrom = index;
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      if (draggingFrom === null) return;
      const row = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-prize-index]');
      if (!row) return;

      const toIndex = Number((row as HTMLElement).dataset.prizeIndex);
      if (Number.isNaN(toIndex) || toIndex === draggingFrom) return;

      reorderPrize(draggingFrom, toIndex);
      draggingFrom = toIndex;
      moved = true;
    };

    const onUp = (ev: PointerEvent) => {
      draggingFrom = null;
      handle.releasePointerCapture(ev.pointerId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (moved) commitPrizes();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }
</script>

<section class="settings-page settings-page--prizes" aria-labelledby="settings-prizes-title">
  <h3 id="settings-prizes-title" class="visually-hidden">等級</h3>
  <div class="settings-list" aria-label="等級リスト">
    {#each draftPrizes as prize, index (prize.id)}
      <div
        class="prize-row"
        class:prize-row--dragging={draggingFrom === index}
        data-prize-index={index}
      >
        <button
          type="button"
          class="prize-drag-handle"
          aria-label="{prize.name}の順序を変更"
          onpointerdown={(e) => startDrag(index, e)}
        >
          <span class="hamburger" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <span class="prize-index">{index + 1}</span>
        <input
          class="field field--display field--compact field--sunken prize-name-input"
          type="text"
          value={prize.name}
          maxlength="24"
          aria-label="等級名"
          oninput={(e) => updatePrize(index, e.currentTarget.value)}
          onblur={commitPrizes}
        />
        <button
          type="button"
          class="btn btn--ghost prize-remove"
          disabled={draftPrizes.length <= 1}
          onclick={() => removePrize(index)}
        >
          削除
        </button>
      </div>
    {/each}
  </div>
  <div class="prizes-actions">
    <button
      type="button"
      class="btn btn--ghost"
      disabled={draftPrizes.length >= MAX_PRIZE_COUNT}
      onclick={addPrize}
    >
      等級を追加
    </button>
  </div>
</section>

<style>
  .settings-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  .settings-page--prizes {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .prize-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    background: var(--panel-sunken);
    border-radius: var(--radius);
  }

  .prize-row--dragging {
    background: var(--line);
  }

  .prize-drag-handle {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--ink-dim);
    cursor: grab;
    touch-action: none;
  }

  .prize-drag-handle:hover {
    color: var(--ink);
    background: var(--panel-sunken);
  }

  .prize-drag-handle:active {
    cursor: grabbing;
    color: var(--amber);
  }

  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    width: 14px;
    pointer-events: none;
  }

  .hamburger span {
    display: block;
    height: 2px;
    background: currentColor;
  }

  .prize-index {
    flex-shrink: 0;
    width: 28px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--panel);
    border-radius: var(--radius);
    color: var(--ink-dim);
    font-family: var(--font-label);
    font-size: 13px;
    font-weight: 700;
  }

  .prize-name-input {
    flex: 1;
    min-width: 0;
  }

  .prize-remove {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0 var(--space-3);
    line-height: 1;
  }

  .prizes-actions {
    display: flex;
    justify-content: flex-end;
    padding: var(--space-2);
    background: var(--panel);
    border-radius: var(--radius);
    flex-shrink: 0;
  }
</style>
