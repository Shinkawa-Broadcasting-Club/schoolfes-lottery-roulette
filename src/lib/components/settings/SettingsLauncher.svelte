<script lang="ts">
  type Props = {
    onOpenDigitOrder: () => void;
    onOpenPrizes: () => void;
    onOpenTheme: () => void;
    onOpenAbout: () => void;
    onResetDefault: () => void;
    onCloseProject: () => void;
  };

  let {
    onOpenDigitOrder,
    onOpenPrizes,
    onOpenTheme,
    onOpenAbout,
    onResetDefault,
    onCloseProject
  }: Props = $props();
</script>

<nav class="settings-launcher" aria-label="設定メニュー">
  <button type="button" class="launcher-item surface surface--interactive" onclick={onOpenDigitOrder}>
    <span class="launcher-item-title">桁の確定順</span>
    <span class="launcher-item-arrow text-dim" aria-hidden="true">›</span>
  </button>
  <button type="button" class="launcher-item surface surface--interactive" onclick={onOpenPrizes}>
    <span class="launcher-item-title">等級</span>
    <span class="launcher-item-arrow text-dim" aria-hidden="true">›</span>
  </button>
  <button type="button" class="launcher-item surface surface--interactive" onclick={onOpenTheme}>
    <span class="launcher-item-title">テーマ</span>
    <span class="launcher-item-arrow text-dim" aria-hidden="true">›</span>
  </button>
  <button type="button" class="launcher-item surface surface--interactive" onclick={onOpenAbout}>
    <span class="launcher-item-title">このアプリについて</span>
    <span class="launcher-item-arrow text-dim" aria-hidden="true">›</span>
  </button>
  <button
    type="button"
    class="launcher-item surface surface--interactive launcher-item--destructive"
    onclick={onResetDefault}
  >
    <span class="launcher-item-title text-danger">デフォルトに戻す</span>
  </button>
  <button type="button" class="launcher-item surface surface--interactive" onclick={onCloseProject}>
    <span class="launcher-item-title">プロジェクトを閉じる</span>
  </button>
</nav>

<style>
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
  }

  .launcher-item-arrow {
    flex-shrink: 0;
    font-size: 22px;
    line-height: 1;
  }
</style>
