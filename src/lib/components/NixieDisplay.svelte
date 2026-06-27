<script lang="ts">
  type Props = {
    digits: string[];
  };

  let { digits }: Props = $props();
</script>

<div class="nixie-display">
  <span id="nixie3" class="nixie-digit tube-cell tube-cell--hero">{digits[2]}</span>
  <span id="nixie2" class="nixie-digit tube-cell tube-cell--hero">{digits[1]}</span>
  <span id="nixie1" class="nixie-digit tube-cell tube-cell--hero">{digits[0]}</span>
</div>

<style>
  .nixie-display {
    display: flex;
    justify-content: stretch;
    align-items: stretch;
    gap: var(--space-2);
    height: 100%;
    flex: 1;
    min-width: 0;
    padding: var(--space-3);
    background: var(--panel);
  }

  .nixie-digit {
    font-size: min(22vw, 48vh);
    line-height: 1;
    flex: 1 1 0;
    min-width: 0;
    height: 100%;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  @media (max-width: 900px) {
    .nixie-display {
      flex: 0 0 auto;
      height: 46vh;
      padding: var(--space-2);
    }

    .nixie-digit {
      font-size: min(26vw, 38vh);
    }
  }
</style>
