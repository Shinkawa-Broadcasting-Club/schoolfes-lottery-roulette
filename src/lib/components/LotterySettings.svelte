<script lang="ts">
  import AppDialog from '$lib/components/AppDialog.svelte';
  import {
    APP_COPYRIGHT,
    APP_GITHUB_URL,
    APP_NAME,
    APP_VERSION
  } from '$lib/appInfo';
  import { OPEN_SOURCE_LICENSE_TEXT } from '$lib/licenses';
  import {
    createDefaultSettings,
    MAX_PRIZE_COUNT,
    normalizePrizeName,
    type DigitRevealOrder,
    type PrizeName
  } from '$lib/lottery';
  import { openExternalUrl } from '$lib/openExternalUrl';
  import { APP_THEME_LABELS, APP_THEMES, type AppTheme } from '$lib/theme';

  type DraftPrizeItem = {
    id: string;
    name: PrizeName;
  };

  type SettingsView = 'launcher' | 'digit-order' | 'prizes' | 'theme' | 'about' | 'licenses';

  type Props = {
    visible: boolean;
    prizes: readonly PrizeName[];
    digitRevealOrder: DigitRevealOrder;
    theme: AppTheme;
    onPrizesChange: (prizes: PrizeName[]) => void;
    onDigitRevealOrderChange: (order: DigitRevealOrder) => void;
    onThemeChange: (theme: AppTheme) => void;
    onClose: () => void;
  };

  let {
    visible,
    prizes,
    digitRevealOrder,
    theme,
    onPrizesChange,
    onDigitRevealOrderChange,
    onThemeChange,
    onClose
  }: Props = $props();

  let activeView = $state<SettingsView>('launcher');
  let draftPrizes = $state<DraftPrizeItem[]>([]);
  let errorMessage = $state('');
  let draggingFrom = $state<number | null>(null);
  let confirmResetVisible = $state(false);
  let wasVisible = false;

  let draftIdCounter = 0;

  function createDraftItem(name: PrizeName): DraftPrizeItem {
    draftIdCounter += 1;
    return { id: `draft-${draftIdCounter}`, name };
  }

  function toDraftItems(names: readonly PrizeName[]): DraftPrizeItem[] {
    draftIdCounter = 0;
    return names.map((name) => createDraftItem(name));
  }

  $effect(() => {
    if (visible && !wasVisible) {
      activeView = 'launcher';
      draftPrizes =
        prizes.length > 0 ? toDraftItems(prizes) : toDraftItems(createDefaultSettings().prizes);
      errorMessage = '';
      draggingFrom = null;
    }
    if (!visible) {
      draggingFrom = null;
      confirmResetVisible = false;
    }
    wasVisible = visible;
  });

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
    draggingFrom = null;
  }

  function openGitHub() {
    void openExternalUrl(APP_GITHUB_URL);
  }

  function normalizeDraftPrizes(): PrizeName[] | null {
    const normalized = draftPrizes.map((item) => normalizePrizeName(item.name));
    if (normalized.some((name) => !name)) {
      errorMessage = '等級名を空にはできません';
      return null;
    }
    if (new Set(normalized).size !== normalized.length) {
      errorMessage = '同じ等級名は使用できません';
      return null;
    }
    if (normalized.length > MAX_PRIZE_COUNT) {
      errorMessage = `等級は最大${MAX_PRIZE_COUNT}個までです`;
      return null;
    }
    errorMessage = '';
    return normalized;
  }

  function commitPrizes() {
    const normalized = normalizeDraftPrizes();
    if (!normalized) {
      draftPrizes = toDraftItems(prizes);
      return;
    }
    onPrizesChange(normalized);
    draftPrizes = toDraftItems(normalized);
  }

  function handleDigitOrderChange(order: DigitRevealOrder) {
    onDigitRevealOrderChange(order);
  }

  function handleThemeChange(nextTheme: AppTheme) {
    onThemeChange(nextTheme);
  }

  function updatePrize(index: number, value: string) {
    draftPrizes[index].name = value;
    draftPrizes = [...draftPrizes];
    errorMessage = '';
  }

  function addPrize() {
    if (draftPrizes.length >= MAX_PRIZE_COUNT) return;
    draftPrizes = [...draftPrizes, createDraftItem(`${draftPrizes.length + 1}等`)];
    commitPrizes();
  }

  function removePrize(index: number) {
    if (draftPrizes.length <= 1) return;
    draftPrizes = draftPrizes.filter((_, i) => i !== index);
    commitPrizes();
  }

  function reorderPrize(from: number, to: number) {
    if (from === to) return;
    const next = [...draftPrizes];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    draftPrizes = next;
    errorMessage = '';
  }

  function startDrag(index: number, e: PointerEvent) {
    if (e.button !== 0) return;

    draggingFrom = index;
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      if (draggingFrom === null) return;
      const row = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-prize-index]');
      if (!row) return;

      const toIndex = Number((row as HTMLElement).dataset.prizeIndex);
      if (Number.isNaN(toIndex) || toIndex === draggingFrom) return;

      reorderPrize(draggingFrom, toIndex);
      draggingFrom = toIndex;
      moved = true;
    };

    const onUp = (ev: PointerEvent) => {
      draggingFrom = null;
      handle.releasePointerCapture(ev.pointerId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (moved) commitPrizes();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }

  function resetToDefault() {
    const defaults = createDefaultSettings();
    draftPrizes = toDraftItems(defaults.prizes);
    errorMessage = '';
    onDigitRevealOrderChange(defaults.digitRevealOrder);
    onThemeChange(defaults.theme);
    onPrizesChange(defaults.prizes);
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
    if (!visible || confirmResetVisible) return;
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

{#if visible}
  <div class="settings-overlay">
    <button
      type="button"
      class="overlay-backdrop"
      aria-label="設定を閉じる"
      onclick={onClose}
    ></button>
    <div class="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="settings-header">
        <div class="settings-header-main">
          {#if activeView !== 'launcher'}
            <button type="button" class="btn btn--ghost settings-back" onclick={goBack}>戻る</button>
          {/if}
          <h2 id="settings-title">
            {#if activeView === 'launcher'}
              設定
            {:else if activeView === 'digit-order'}
              桁の確定順
            {:else if activeView === 'theme'}
              テーマ
            {:else if activeView === 'about'}
              このアプリについて
            {:else if activeView === 'licenses'}
              オープンソースライセンス
            {:else}
              等級
            {/if}
          </h2>
        </div>
        <button type="button" class="btn btn--ghost settings-close" onclick={onClose}>閉じる</button>
      </div>

      <div class="settings-body">
        {#if activeView === 'launcher'}
          <nav class="settings-launcher" aria-label="設定メニュー">
            <button type="button" class="launcher-item surface surface--interactive" onclick={() => openView('digit-order')}>
              <span class="launcher-item-title text-amber">桁の確定順</span>
              <span class="launcher-item-arrow text-dim" aria-hidden="true">›</span>
            </button>
            <button type="button" class="launcher-item surface surface--interactive" onclick={() => openView('prizes')}>
              <span class="launcher-item-title text-amber">等級</span>
              <span class="launcher-item-arrow text-dim" aria-hidden="true">›</span>
            </button>
            <button type="button" class="launcher-item surface surface--interactive" onclick={() => openView('theme')}>
              <span class="launcher-item-title text-amber">テーマ</span>
              <span class="launcher-item-arrow text-dim" aria-hidden="true">›</span>
            </button>
            <button type="button" class="launcher-item surface surface--interactive" onclick={() => openView('about')}>
              <span class="launcher-item-title text-amber">このアプリについて</span>
              <span class="launcher-item-arrow text-dim" aria-hidden="true">›</span>
            </button>
            <button type="button" class="launcher-item surface surface--interactive launcher-item--destructive" onclick={requestResetToDefault}>
              <span class="launcher-item-title text-danger">デフォルトに戻す</span>
            </button>
          </nav>
        {:else if activeView === 'digit-order'}
          <section class="settings-page surface" aria-labelledby="settings-digit-order-title">
            <h3 id="settings-digit-order-title" class="visually-hidden">桁の確定順</h3>
            <select
              class="field field--display field--full"
              value={digitRevealOrder}
              aria-labelledby="settings-digit-order-title"
              onchange={(e) => handleDigitOrderChange(e.currentTarget.value as DigitRevealOrder)}
            >
              <option value="ones-first">1の位から（右→左）</option>
              <option value="hundreds-first">100の位から（左→右）</option>
            </select>
          </section>
        {:else if activeView === 'theme'}
          <section class="settings-page surface" aria-labelledby="settings-theme-title">
            <h3 id="settings-theme-title" class="visually-hidden">テーマ</h3>
            <select
              class="field field--display field--full"
              value={theme}
              aria-labelledby="settings-theme-title"
              onchange={(e) => handleThemeChange(e.currentTarget.value as AppTheme)}
            >
              {#each APP_THEMES as appTheme (appTheme)}
                <option value={appTheme}>{APP_THEME_LABELS[appTheme]}</option>
              {/each}
            </select>
          </section>
        {:else if activeView === 'about'}
          <section class="settings-page settings-page--about surface" aria-labelledby="settings-about-title">
            <h3 id="settings-about-title" class="visually-hidden">このアプリについて</h3>
            <div class="about-identity">
              <div class="about-title-row">
                <span class="about-app-name">{APP_NAME}</span>
                <span class="about-version">v{APP_VERSION}</span>
              </div>
              <p class="about-copyright">{APP_COPYRIGHT}</p>
              <button type="button" class="about-github-link" aria-label="GitHub で開く" onclick={openGitHub}>
                <span class="about-github-label">GitHub</span>
                <svg class="about-github-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </button>
            </div>
            <button type="button" class="launcher-item surface surface--interactive about-licenses-link" onclick={() => openView('licenses')}>
              <span class="launcher-item-title text-amber">オープンソースライセンス</span>
              <span class="launcher-item-arrow text-dim" aria-hidden="true">›</span>
            </button>
          </section>
        {:else if activeView === 'licenses'}
          <section class="settings-page settings-page--scroll surface" aria-labelledby="settings-licenses-title">
            <h3 id="settings-licenses-title" class="visually-hidden">オープンソースライセンス</h3>
            <p class="license-note text-dim">
              本アプリおよび同梱 OSS は MIT License の下で提供されています。
            </p>
            <pre class="license-text">{OPEN_SOURCE_LICENSE_TEXT}</pre>
          </section>
        {:else}
          <section class="settings-page settings-page--prizes surface" aria-labelledby="settings-prizes-title">
            <h3 id="settings-prizes-title" class="visually-hidden">等級</h3>
            <div class="settings-list" aria-label="等級リスト">
              {#each draftPrizes as prize, index (prize.id)}
                <div
                  class="prize-row"
                  class:prize-row--dragging={draggingFrom === index}
                  data-prize-index={index}
                >
                  <button
                    type="button"
                    class="prize-drag-handle"
                    aria-label="{prize.name}の順序を変更"
                    onpointerdown={(e) => startDrag(index, e)}
                  >
                    <span class="hamburger" aria-hidden="true">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </button>
                  <span class="prize-index">{index + 1}</span>
                  <input
                    class="field field--display field--compact field--sunken prize-name-input"
                    type="text"
                    value={prize.name}
                    maxlength="24"
                    aria-label="等級名"
                    oninput={(e) => updatePrize(index, e.currentTarget.value)}
                    onblur={commitPrizes}
                  />
                  <button
                    type="button"
                    class="btn btn--ghost prize-remove"
                    disabled={draftPrizes.length <= 1}
                    onclick={() => removePrize(index)}
                  >
                    削除
                  </button>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      </div>

      {#if errorMessage}
        <p class="settings-error text-danger">{errorMessage}</p>
      {/if}

      {#if activeView === 'prizes'}
        <div class="settings-actions">
          <button
            type="button"
            class="btn btn--ghost"
            disabled={draftPrizes.length >= MAX_PRIZE_COUNT}
            onclick={addPrize}
          >
            等級を追加
          </button>
        </div>
      {/if}
    </div>

    <div class="settings-dialog-layer">
      <AppDialog
        visible={confirmResetVisible}
        kind="confirm"
        message="設定をデフォルトに戻しますか？"
        onConfirm={confirmResetToDefault}
        onCancel={cancelResetToDefault}
      />
    </div>
  </div>
{/if}

<style>
  .settings-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    justify-content: flex-end;
    padding: 0;
  }

  .settings-panel {
    position: relative;
    z-index: 1;
    width: min(100%, 520px);
    height: 100%;
    min-height: var(--app-min-height);
    padding: var(--space-3);
    border-left: 1px solid var(--line-strong);
    background: var(--panel-raised);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    overflow: hidden;
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }

  .settings-header-main {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .settings-back {
    flex-shrink: 0;
    padding-inline: var(--space-2);
  }

  h2,
  h3,
  p {
    margin: 0;
  }

  h2 {
    color: var(--amber);
    font-size: var(--text-lg);
    letter-spacing: 0.06em;
  }

  .settings-close {
    flex-shrink: 0;
  }

  .settings-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .settings-launcher {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .launcher-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3);
    color: var(--ink);
    text-align: left;
  }

  .launcher-item-title {
    font-size: var(--text-md);
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .launcher-item-arrow {
    flex-shrink: 0;
    font-size: 22px;
    line-height: 1;
  }

  .settings-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-2);
    flex-shrink: 0;
  }

  .settings-page--prizes {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .settings-page--scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .settings-page--about {
    flex: 1;
    min-height: 0;
  }

  .about-identity {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }

  .about-title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2);
  }

  .about-app-name {
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--ink);
    line-height: 1.3;
  }

  .about-version {
    font-family: var(--font-label);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--ink-dim);
    letter-spacing: 0.02em;
  }

  .about-copyright {
    margin: 0;
    font-family: var(--font-label);
    font-size: var(--text-sm);
    color: var(--ink-dim);
    line-height: 1.5;
  }

  .about-github-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: var(--space-1);
    padding: 0;
    border: none;
    background: transparent;
    color: var(--ink);
    cursor: pointer;
    font: inherit;
    line-height: 1.4;
  }

  .about-github-link:hover {
    color: var(--amber);
  }

  .about-github-label {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .about-github-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  .about-licenses-link {
    margin-top: var(--space-3);
  }

  .license-note {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  .license-text {
    margin: 0;
    padding: var(--space-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--panel);
    color: var(--ink-dim);
    font-family: var(--font-label);
    font-size: 11px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-x: auto;
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 0;
  }

  .prize-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--panel);
    transition:
      border-color var(--transition),
      box-shadow var(--transition);
  }

  .prize-row--dragging {
    border-color: var(--amber-deep);
    box-shadow: 0 0 0 1px rgba(255, 158, 44, 0.25);
  }

  .prize-drag-handle {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 32px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--radius);
    background: transparent;
    color: var(--ink-dim);
    cursor: grab;
    touch-action: none;
    transition:
      color var(--transition),
      border-color var(--transition),
      background-color var(--transition);
  }

  .prize-drag-handle:hover {
    color: var(--ink);
    border-color: var(--line-strong);
    background: var(--panel-raised);
  }

  .prize-drag-handle:active {
    cursor: grabbing;
    color: var(--amber);
  }

  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    width: 14px;
    pointer-events: none;
  }

  .hamburger span {
    display: block;
    height: 2px;
    border-radius: 1px;
    background: currentColor;
  }

  .prize-index {
    flex-shrink: 0;
    width: 28px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    color: var(--amber);
    font-family: var(--font-label);
    font-size: 13px;
    font-weight: 700;
  }

  .prize-name-input {
    flex: 1;
    min-width: 0;
  }

  .prize-remove {
    flex-shrink: 0;
    height: 32px;
    padding-inline: var(--space-2);
  }

  .settings-error {
    margin: 0;
    font-weight: 700;
  }

  .settings-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-1);
    padding-top: var(--space-2);
    border-top: 1px solid var(--line);
    flex-shrink: 0;
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

  @media (max-width: 640px) {
    .settings-panel {
      width: 100%;
    }
  }
</style>
