<script lang="ts">
  import { APP_THEME_LABELS, APP_THEMES, type AppTheme } from '$lib/theme';

  type Props = {
    theme: AppTheme;
    onChange: (theme: AppTheme) => void;
  };

  let { theme, onChange }: Props = $props();
</script>

<section class="settings-page" aria-labelledby="settings-theme-title">
  <h3 id="settings-theme-title" class="visually-hidden">テーマ</h3>
  <select
    class="field field--display field--full"
    value={theme}
    aria-labelledby="settings-theme-title"
    onchange={(e) => onChange(e.currentTarget.value as AppTheme)}
  >
    {#each APP_THEMES as appTheme (appTheme)}
      <option value={appTheme}>{APP_THEME_LABELS[appTheme]}</option>
    {/each}
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
