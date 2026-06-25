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
        <button class="btn--success" onclick={() => onAddManually(prize)}>+ 番号追加</button>
      </div>
      <div class="result-numbers">
        {#each results[prize] as number, index (`${prize}-${number}`)}
          <div class="result-item" data-number={number}>
            <span class="number-text">{number}</span>
            <button
              class="btn--small btn--edit"
              title="編集"
              onclick={() => onEditNumber(prize, index)}>✎</button
            >
            <button
              class="btn--small btn--delete"
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
    flex: 0 1 700px;
    min-width: 340px;
    display: flex;
    flex-direction: column;
  }

  .results-section {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: var(--space-2);
    background: var(--panel-sunken);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
    flex: 1 1 0;
    min-height: 0;
  }

  .section-title {
    font-size: clamp(15px, 1.25vw, 19px);
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
    font-size: clamp(24px, 2.15vw, 36px);
    font-family: var(--font-tube);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    position: relative;
    padding: 0 var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-lg);
    background-color: var(--panel-raised);
    color: var(--amber);
    text-shadow: 0 0 5px rgba(255, 158, 44, 0.35);
    display: inline-flex;
    align-items: center;
    min-width: 82px;
    justify-content: center;
    transition: border-color var(--transition);
  }

  .result-item:hover {
    border-color: var(--amber);
  }

  .number-text {
    display: inline-block;
  }

  .btn--success {
    font-family: var(--font-label);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius);
    border: 1px solid var(--line-strong);
    background-color: transparent;
    color: var(--ink-dim);
    cursor: pointer;
    white-space: nowrap;
    transition:
      color var(--transition),
      border-color var(--transition);
  }

  .btn--success:hover {
    color: var(--ok);
    border-color: var(--ok);
  }

  .btn--small {
    width: 22px;
    height: 22px;
    border-radius: var(--radius);
    border: 1px solid var(--line-strong);
    background-color: var(--panel-raised);
    font-size: 13px;
    line-height: 1;
    color: var(--ink-dim);
    cursor: pointer;
    position: absolute;
    top: -8px;
    z-index: 10;
    opacity: 0;
    transition:
      opacity var(--transition),
      color var(--transition),
      border-color var(--transition);
  }

  .result-item:hover .btn--small,
  .btn--small:focus-visible {
    opacity: 1;
  }

  .btn--edit {
    right: 24px;
  }

  .btn--delete {
    right: -7px;
  }

  .btn--edit:hover {
    color: var(--ok);
    border-color: var(--ok);
  }

  .btn--delete:hover {
    color: var(--danger);
    border-color: var(--danger);
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
