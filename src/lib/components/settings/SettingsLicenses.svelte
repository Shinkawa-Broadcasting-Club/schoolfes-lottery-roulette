<script lang="ts">
  import { OPEN_SOURCE_LICENSE_TEXT } from '$lib/licenses';
</script>

<section class="settings-page settings-page--scroll" aria-labelledby="settings-licenses-title">
  <h3 id="settings-licenses-title" class="visually-hidden">オープンソースライセンス</h3>
  <p class="license-note text-dim">
    本アプリおよび同梱 OSS は MIT License の下で提供されています。
  </p>
  <pre class="license-text">{OPEN_SOURCE_LICENSE_TEXT}</pre>
</section>

<style>
  .settings-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  .settings-page--scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .license-note {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  .license-text {
    margin: 0;
    padding: var(--space-2);
    background: var(--panel-sunken);
    border-radius: var(--radius);
    color: var(--ink-dim);
    font-family: var(--font-label);
    font-size: 11px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-x: auto;
  }
</style>
