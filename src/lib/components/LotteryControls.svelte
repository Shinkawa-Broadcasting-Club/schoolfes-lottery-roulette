<script lang="ts">
  import type { PrizeName } from '$lib/lottery';

  type Props = {
    prizes: readonly PrizeName[];
    selectedPrize?: PrizeName | '';
    minValue?: string;
    maxValue?: string;
    drawDisabled: boolean;
    projectName: string;
    onDraw: () => void;
    onOpenSettings: () => void;
  };

  let {
    prizes,
    selectedPrize = $bindable<PrizeName | ''>(''),
    minValue = $bindable('0'),
    maxValue = $bindable('999'),
    drawDisabled,
    projectName,
    onDraw,
    onOpenSettings
  }: Props = $props();
</script>

<div class="input-group">
  <span class="project-label text-dim">{projectName}</span>
  <label class="field-label" for="name">抽選名:</label>
  <select class="field" id="name" bind:value={selectedPrize}>
    <option value="">選択してください</option>
    {#each prizes as prize (prize)}
      <option value={prize}>{prize}</option>
    {/each}
  </select>
  <label class="field-label" for="min">最小値:</label>
  <input class="field field--number" type="number" id="min" min="0" max="999" bind:value={minValue} />
  <label class="field-label" for="max">最大値:</label>
  <input class="field field--number" type="number" id="max" min="0" max="999" bind:value={maxValue} />
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
    flex-shrink: 0;
  }

  .project-label {
    font-family: var(--font-label);
    font-size: var(--text-sm);
    margin-right: var(--space-2);
  }

  .input-group :global(.btn) {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  #drawButton {
    border-radius: 2px;
    padding-inline: var(--space-6);
  }
</style>
