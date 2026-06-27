<script lang="ts">
  import { APP_COPYRIGHT, APP_GITHUB_URL, APP_NAME, APP_VERSION } from '$lib/appInfo';
  import { openExternalUrl } from '$lib/openExternalUrl';

  type Props = {
    onOpenLicenses: () => void;
  };

  let { onOpenLicenses }: Props = $props();

  function openGitHub() {
    void openExternalUrl(APP_GITHUB_URL);
  }
</script>

<section class="settings-page settings-page--about" aria-labelledby="settings-about-title">
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
  <button
    type="button"
    class="launcher-item surface surface--interactive about-licenses-link"
    onclick={onOpenLicenses}
  >
    <span class="launcher-item-title">オープンソースライセンス</span>
    <span class="launcher-item-arrow text-dim" aria-hidden="true">›</span>
  </button>
</section>

<style>
  .settings-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex-shrink: 0;
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
    color: var(--ink);
    line-height: 1.3;
  }

  .about-version {
    font-family: var(--font-label);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--ink-dim);
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    align-self: flex-start;
    width: 100%;
    margin-top: var(--space-3);
    padding: var(--space-4);
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
