<script lang="ts">
  import type { LotteryResults, PrizeName } from '$lib/lottery';

  type Props = {
    prizes: readonly PrizeName[];
    results: LotteryResults;
    onAddManually: (sectionName: PrizeName) => void;
    onEditNumber: (sectionName: PrizeName, index: number) => void;
    onDeleteNumber: (sectionName: PrizeName, index: number) => void;
  };

  let { prizes, results, onAddManually, onEditNumber, onDeleteNumber }: Props = $props();
</script>

<div class="results-container" id="results-container">
  {#each prizes as prize (prize)}
    <section class="results-section" data-name={prize}>
      <div class="section-title">
        <span>{prize}</span>
        <button type="button" class="btn btn--success" onclick={() => onAddManually(prize)}>+ 番号追加</button>
      </div>
      <div class="result-numbers">
        {#each results[prize] as number, index (`${prize}-${index}`)}
          <div class="result-item tube-cell" data-number={number}>
            <span class="number-text">{number}</span>
            <button
              type="button"
              class="result-action-btn result-edit"
              title="編集"
              onclick={() => onEditNumber(prize, index)}>✎</button
            >
            <button
              type="button"
              class="result-action-btn result-delete"
              title="削除"
              onclick={() => onDeleteNumber(prize, index)}>×</button
            >
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .results-container {
    height: 100%;
    overflow: hidden;
    padding: var(--space-2);
    gap: var(--space-2);
    flex: 0 1 var(--results-panel-width);
    width: var(--results-panel-width);
    max-width: var(--results-panel-max);
    min-width: var(--results-panel-min);
    display: flex;
    flex-direction: column;
  }

  .results-section {
    padding: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
    flex: 1 1 0;
    min-height: 0;
  }

  .section-title {
    font-size: clamp(16px, 1.5vw, 24px);
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--amber);
    width: 100%;
    padding: 0 0 var(--space-1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2);
  }

  .result-numbers {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: var(--space-1);
    width: 100%;
    min-height: 0;
    flex: 1;
    overflow-y: auto;
  }

  .result-item {
    font-size: clamp(20px, 1.75vw, 36px);
    font-variant-numeric: tabular-nums;
    position: relative;
    padding: 0 44px 0 var(--space-2);
    background-color: var(--panel-raised);
    display: inline-flex;
    align-items: center;
    min-width: 96px;
  }

  .result-item:hover {
    background-color: var(--line);
  }

  .number-text {
    display: inline-block;
    min-width: 3ch;
    text-align: right;
  }

  .result-action-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: var(--radius);
    background-color: var(--panel);
    font-size: 12px;
    line-height: 1;
    color: var(--ink-dim);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.2;
    z-index: 10;
  }

  .result-item:hover .result-action-btn,
  .result-action-btn:focus-visible {
    opacity: 1;
  }

  .result-action-btn.result-edit:hover {
    color: var(--ok);
    background-color: var(--panel-sunken);
  }

  .result-action-btn.result-delete:hover {
    color: var(--danger);
    background-color: var(--panel-sunken);
  }

  .result-edit {
    right: 22px;
  }

  .result-delete {
    right: 1px;
  }

  @media (max-width: var(--breakpoint-md)) {
    .results-container {
      flex: 1 1 auto;
      width: 100%;
      min-width: 0;
    }

    .results-section {
      flex: 1 1 0;
      min-height: 0;
    }
  }
</style>
