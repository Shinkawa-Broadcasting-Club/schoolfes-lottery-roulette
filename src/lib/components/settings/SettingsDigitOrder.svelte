<script lang="ts">
  import type { DigitRevealOrder } from '$lib/lottery';

  type Props = {
    digitRevealOrder: DigitRevealOrder;
    onChange: (order: DigitRevealOrder) => void;
  };

  let { digitRevealOrder, onChange }: Props = $props();
</script>

<section class="settings-page" aria-labelledby="settings-digit-order-title">
  <h3 id="settings-digit-order-title" class="visually-hidden">桁の確定順</h3>
  <select
    class="field field--display field--full"
    value={digitRevealOrder}
    aria-labelledby="settings-digit-order-title"
    onchange={(e) => onChange(e.currentTarget.value as DigitRevealOrder)}
  >
    <option value="ones-first">1の位から（右→左）</option>
    <option value="hundreds-first">100の位から（左→右）</option>
  </select>
</section>

<style>
  .settings-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex-shrink: 0;
  }
</style>
