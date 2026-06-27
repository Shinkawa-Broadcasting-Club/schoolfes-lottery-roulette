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
    <section class="results-section surface" data-name={prize}>
      <div class="section-title">
        <span>{prize}</span>
        <button type="button" class="btn btn--success" onclick={() => onAddManually(prize)}>+ 番号追加</button>
      </div>
      <div class="result-numbers">
        {#each results[prize] as number, index (`${prize}-${number}`)}
          <div class="result-item tube-cell" data-number={number}>
            <span class="number-text">{number}</span>
            <button
              type="button"
              class="btn btn--icon btn--ok result-edit"
              title="編集"
              onclick={() => onEditNumber(prize, index)}>✎</button
            >
            <button
              type="button"
              class="btn btn--icon btn--danger result-delete"
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
    gap: var(--space-1);
    border-left: 1px solid var(--line);
    background: var(--panel-raised);
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
    font-size: clamp(14px, 1.1vw, 19px);
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--amber);
    width: 100%;
    padding: 0 0 var(--space-1);
    border-bottom: 1px solid var(--line);
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
    overflow: hidden;
  }

  .result-item {
    font-size: clamp(20px, 1.75vw, 36px);
    font-variant-numeric: tabular-nums;
    position: relative;
    padding: 0 var(--space-2);
    background-color: var(--panel-raised);
    display: inline-flex;
    align-items: center;
    min-width: 72px;
    justify-content: center;
    transition: border-color var(--transition);
  }

  .result-item:hover {
    border-color: var(--amber);
  }

  .number-text {
    display: inline-block;
  }

  .result-edit,
  .result-delete {
    position: absolute;
    top: -8px;
    z-index: 10;
    opacity: 0;
  }

  .result-item:hover .result-edit,
  .result-item:hover .result-delete,
  .result-edit:focus-visible,
  .result-delete:focus-visible {
    opacity: 1;
  }

  .result-edit {
    right: 24px;
  }

  .result-delete {
    right: -7px;
  }

  @media (max-width: 900px) {
    .results-container {
      flex: 1 1 auto;
      width: 100%;
      min-width: 0;
      border-left: none;
      border-top: 1px solid var(--line);
    }

    .results-section {
      flex: 1 1 0;
      min-height: 0;
    }
  }
</style>
