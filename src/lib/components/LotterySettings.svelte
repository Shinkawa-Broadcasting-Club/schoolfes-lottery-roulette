<script lang="ts">
  import { onMount } from 'svelte';
  import AppDialog from '$lib/components/AppDialog.svelte';
  import AppPanel from '$lib/components/AppPanel.svelte';
  import PrizesEditor from '$lib/components/settings/PrizesEditor.svelte';
  import SettingsAbout from '$lib/components/settings/SettingsAbout.svelte';
  import SettingsDigitOrder from '$lib/components/settings/SettingsDigitOrder.svelte';
  import SettingsLauncher from '$lib/components/settings/SettingsLauncher.svelte';
  import SettingsLicenses from '$lib/components/settings/SettingsLicenses.svelte';
  import SettingsTheme from '$lib/components/settings/SettingsTheme.svelte';
  import { createDefaultSettings, type DigitRevealOrder, type PrizeName } from '$lib/lottery';
  import type { AppTheme } from '$lib/theme';

  type SettingsView = 'launcher' | 'digit-order' | 'prizes' | 'theme' | 'about' | 'licenses';

  type Props = {
    prizes: readonly PrizeName[];
    digitRevealOrder: DigitRevealOrder;
    theme: AppTheme;
    onPrizesChange: (prizes: PrizeName[]) => void;
    onDigitRevealOrderChange: (order: DigitRevealOrder) => void;
    onThemeChange: (theme: AppTheme) => void;
    onClose: () => void;
    onCloseProject: () => void;
  };

  let {
    prizes,
    digitRevealOrder,
    theme,
    onPrizesChange,
    onDigitRevealOrderChange,
    onThemeChange,
    onClose,
    onCloseProject
  }: Props = $props();

  let activeView = $state<SettingsView>('launcher');
  let errorMessage = $state('');
  let confirmResetVisible = $state(false);

  onMount(() => {
    activeView = 'launcher';
    errorMessage = '';
  });

  const viewTitle = $derived(
    activeView === 'launcher'
      ? '設定'
      : activeView === 'digit-order'
        ? '桁の確定順'
        : activeView === 'theme'
          ? 'テーマ'
          : activeView === 'about'
            ? 'このアプリについて'
            : activeView === 'licenses'
              ? 'オープンソースライセンス'
              : '等級'
  );

  function openView(view: SettingsView) {
    activeView = view;
    errorMessage = '';
  }

  function goBack() {
    if (activeView === 'licenses') {
      activeView = 'about';
    } else {
      activeView = 'launcher';
    }
    errorMessage = '';
  }

  function resetToDefault() {
    const defaults = createDefaultSettings();
    onDigitRevealOrderChange(defaults.digitRevealOrder);
    onThemeChange(defaults.theme);
    onPrizesChange(defaults.prizes);
    errorMessage = '';
  }

  function requestResetToDefault() {
    confirmResetVisible = true;
  }

  function confirmResetToDefault() {
    confirmResetVisible = false;
    resetToDefault();
  }

  function cancelResetToDefault() {
    confirmResetVisible = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (confirmResetVisible) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (activeView === 'launcher') {
        onClose();
      } else {
        goBack();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<AppPanel
  title={viewTitle}
  onBack={activeView !== 'launcher' ? goBack : undefined}
  onClose={onClose}
  {errorMessage}
  panelClass="settings-panel"
  contentClass={activeView === 'prizes' ? 'settings-body--prizes' : ''}
>
  {#if activeView === 'launcher'}
    <SettingsLauncher
      onOpenDigitOrder={() => openView('digit-order')}
      onOpenPrizes={() => openView('prizes')}
      onOpenTheme={() => openView('theme')}
      onOpenAbout={() => openView('about')}
      onResetDefault={requestResetToDefault}
      {onCloseProject}
    />
  {:else if activeView === 'digit-order'}
    <SettingsDigitOrder {digitRevealOrder} onChange={onDigitRevealOrderChange} />
  {:else if activeView === 'theme'}
    <SettingsTheme {theme} onChange={onThemeChange} />
  {:else if activeView === 'about'}
    <SettingsAbout onOpenLicenses={() => openView('licenses')} />
  {:else if activeView === 'licenses'}
    <SettingsLicenses />
  {:else}
    <PrizesEditor {prizes} {onPrizesChange} onError={(msg) => (errorMessage = msg)} />
  {/if}
</AppPanel>

<div class="settings-dialog-layer">
  <AppDialog
    visible={confirmResetVisible}
    kind="confirm"
    message="設定をデフォルトに戻しますか？"
    onConfirm={confirmResetToDefault}
    onCancel={cancelResetToDefault}
  />
</div>

<style>
  :global(.settings-panel.app-panel) {
    padding: var(--space-4) max(var(--space-4), calc(50% - 260px));
  }

  :global(.settings-body--prizes) {
    overflow: hidden;
  }

  .settings-dialog-layer {
    position: fixed;
    inset: 0;
    z-index: 1200;
    pointer-events: none;
  }

  .settings-dialog-layer :global(.dialog-overlay) {
    pointer-events: auto;
  }
</style>
