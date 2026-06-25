<script lang="ts">
  import type { PrizeName } from '$lib/lottery';

  type Props = {
    prizes: readonly PrizeName[];
    selectedPrize?: PrizeName | '';
    minValue?: string;
    maxValue?: string;
    drawDisabled: boolean;
    onDraw: () => void;
    onOpenSettings: () => void;
  };

  let {
    prizes,
    selectedPrize = $bindable<PrizeName | ''>(''),
    minValue = $bindable('0'),
    maxValue = $bindable('999'),
    drawDisabled,
    onDraw,
    onOpenSettings
  }: Props = $props();
</script>

<div class="input-group">
  <label for="name">抽選名:</label>
  <select id="name" bind:value={selectedPrize}>
    <option value="">選択してください</option>
    {#each prizes as prize (prize)}
      <option value={prize}>{prize}</option>
    {/each}
  </select>
  <label for="min">最小値:</label>
  <input type="number" id="min" min="0" max="999" bind:value={minValue} />
  <label for="max">最大値:</label>
  <input type="number" id="max" min="0" max="999" bind:value={maxValue} />
  <button id="drawButton" class="btn" disabled={drawDisabled} onclick={onDraw}>抽選</button>
  <button type="button" class="btn btn--ghost" onclick={onOpenSettings}>設定</button>
</div>

<style>
  .input-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    padding: var(--space-3) var(--space-4);
    background: var(--panel-raised);
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }

  label {
    color: var(--ink-dim);
    font-family: var(--font-label);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  input,
  select {
    font-size: 15px;
    font-family: var(--font-label);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius);
    border: 1px solid var(--line-strong);
    background-color: var(--panel-sunken);
    color: var(--ink);
    transition: border-color var(--transition);
  }

  input:hover,
  select:hover {
    border-color: var(--amber-deep);
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--amber);
  }

  input[type='number'] {
    width: 88px;
  }

  .input-group :global(.btn) {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>
