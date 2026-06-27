<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import AppDialog from '$lib/components/AppDialog.svelte';
  import LotteryControls from '$lib/components/LotteryControls.svelte';
  import LotterySettings from '$lib/components/LotterySettings.svelte';
  import NixieDisplay from '$lib/components/NixieDisplay.svelte';
  import ProjectSelector from '$lib/components/ProjectSelector.svelte';
  import ResultsPanel from '$lib/components/ResultsPanel.svelte';
  import { getProjectsIndex, isGlobalStateReady, setProjectsIndex } from '$lib/appState.svelte';
  import {
    createDefaultSettings,
    createEmptyResults,
    type DigitRevealOrder,
    type LotteryResults,
    type PrizeName
  } from '$lib/lottery';
  import { applyThemeWithPersistence, createAutoSaveHandlers } from '$lib/persistence/autoSave';
  import { createDialogService } from '$lib/services/dialogService.svelte';
  import { createLotteryController } from '$lib/services/lotteryController';
  import { createDrumrollPlayer, createNixieController } from '$lib/services/nixieController.svelte';
  import { createProjectManager } from '$lib/services/projectManager';
  import type { AppTheme } from '$lib/theme';

  const defaultSettings = createDefaultSettings();

  let currentProjectId = $state<string | null>(null);
  let currentProjectName = $state('');
  let storageReady = $state(false);

  let prizes = $state<PrizeName[]>(defaultSettings.prizes);
  let digitRevealOrder = $state<DigitRevealOrder>(defaultSettings.digitRevealOrder);
  let theme = $state<AppTheme>(defaultSettings.theme);
  let selectedPrize = $state<PrizeName | ''>('');
  let minValue = $state('0');
  let maxValue = $state('999');
  let drawDisabled = $state(false);
  let results = $state<LotteryResults>(createEmptyResults(defaultSettings.prizes));
  let settingsVisible = $state(false);

  let drumroll = $state<HTMLAudioElement | null>(null);

  const dialog = createDialogService();
  const nixie = createNixieController(() => digitRevealOrder);
  const drumrollPlayer = createDrumrollPlayer(() => drumroll);

  const autoSave = createAutoSaveHandlers(() => (storageReady ? currentProjectId : null));

  const projectManager = createProjectManager({
    getProjectsIndex,
    setProjectsIndex,
    getSession: () => ({
      projectId: currentProjectId,
      projectName: currentProjectName,
      storageReady
    }),
    setSession: (session) => {
      if (session.projectId !== undefined) currentProjectId = session.projectId;
      if (session.projectName !== undefined) currentProjectName = session.projectName;
      if (session.storageReady !== undefined) storageReady = session.storageReady;
    },
    applySettings: (settings) => {
      prizes = [...settings.prizes];
      digitRevealOrder = settings.digitRevealOrder;
      theme = settings.theme;
      applyThemeWithPersistence(settings.theme);
    },
    setResults: (nextResults) => {
      results = nextResults;
    },
    resetLotteryView: () => {
      settingsVisible = false;
      selectedPrize = '';
      nixie.reset();
    }
  });

  const lottery = createLotteryController({
    dialog,
    getPrizes: () => prizes,
    getResults: () => results,
    setResults: (nextResults) => {
      results = nextResults;
    },
    getSelectedPrize: () => selectedPrize,
    getMinValue: () => minValue,
    getMaxValue: () => maxValue,
    setSelectedPrize: (prize) => {
      selectedPrize = prize;
    },
    setPrizes: (nextPrizes) => {
      prizes = nextPrizes;
    },
    onDrawStart: () => {
      drawDisabled = true;
      drumrollPlayer.play();
      nixie.startRandomization();
    },
    onDrawComplete: async (prizeName, randomNumber) => {
      const revealDelay = nixie.stopRandomization(randomNumber);
      setTimeout(() => {
        void lottery.addToSection(prizeName, randomNumber).finally(() => {
          drawDisabled = false;
        });
      }, revealDelay);
    }
  });

  $effect(() => {
    applyThemeWithPersistence(theme);
  });

  $effect(() => {
    if (!storageReady || !currentProjectId) return;
    autoSave.saveSettings({ prizes, digitRevealOrder, theme });
  });

  $effect(() => {
    if (!storageReady || !currentProjectId) return;
    autoSave.saveResults(results);
  });

  const attachDrumroll: Attachment<HTMLAudioElement> = (audioElement) => {
    drumroll = audioElement;
    return () => {
      if (drumroll === audioElement) drumroll = null;
    };
  };

  onDestroy(() => {
    nixie.destroy();
  });
</script>

<div class="app-shell">
  {#if !isGlobalStateReady()}
    <!-- 初期ロード中 -->
  {:else if currentProjectId === null}
    <ProjectSelector
      projects={getProjectsIndex()}
      onOpen={projectManager.openProject}
      onCreateNew={projectManager.createProject}
      onDelete={projectManager.deleteProject}
      onRename={projectManager.renameProject}
    />
  {:else if settingsVisible}
    <LotterySettings
      {prizes}
      {digitRevealOrder}
      {theme}
      onPrizesChange={lottery.handlePrizesChange}
      onDigitRevealOrderChange={(order) => (digitRevealOrder = order)}
      onThemeChange={(nextTheme) => (theme = nextTheme)}
      onClose={() => (settingsVisible = false)}
      onCloseProject={projectManager.closeProject}
    />
  {:else}
    <LotteryControls
      {prizes}
      bind:selectedPrize
      bind:minValue
      bind:maxValue
      {drawDisabled}
      projectName={currentProjectName}
      onDraw={lottery.generateRandomNumber}
      onOpenSettings={() => (settingsVisible = true)}
    />

    <main class="wrapper">
      <NixieDisplay digits={nixie.digits} />
      <ResultsPanel
        {prizes}
        {results}
        onAddManually={lottery.addManually}
        onEditNumber={lottery.editNumber}
        onDeleteNumber={lottery.deleteNumber}
      />
    </main>

    <AppDialog
      visible={dialog.visible}
      kind={dialog.kind}
      message={dialog.message}
      bind:input={dialog.input}
      onConfirm={dialog.confirm}
      onCancel={dialog.cancel}
    />
  {/if}
</div>

<audio {@attach attachDrumroll} id="drumroll" src="/drumroll.mp3"></audio>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    min-width: var(--app-min-width);
    min-height: var(--app-min-height);
  }

  .wrapper {
    display: flex;
    align-items: stretch;
    width: 100%;
    flex: 1;
    min-height: 0;
  }

  @media (max-width: var(--breakpoint-md)) {
    .wrapper {
      flex-direction: column;
    }
  }
</style>
