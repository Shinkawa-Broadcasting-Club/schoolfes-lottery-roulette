export const APP_THEMES = ['orange', 'dark', 'light'] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export const DEFAULT_APP_THEME: AppTheme = 'orange';

export const THEME_LOCALSTORAGE_KEY = 'sbc-lottery-roulette-last-theme';

export const APP_THEME_LABELS: Record<AppTheme, string> = {
  orange: 'Orange',
  dark: 'Dark',
  light: 'Light'
};

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === 'string' && (APP_THEMES as readonly string[]).includes(value);
}

export function applyTheme(theme: AppTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

export function persistThemeChoice(theme: AppTheme): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(THEME_LOCALSTORAGE_KEY, theme);
  } catch {
    /* quota / private mode */
  }
}

export function readPersistedTheme(): AppTheme {
  if (typeof localStorage === 'undefined') return DEFAULT_APP_THEME;
  try {
    const stored = localStorage.getItem(THEME_LOCALSTORAGE_KEY);
    return isAppTheme(stored) ? stored : DEFAULT_APP_THEME;
  } catch {
    return DEFAULT_APP_THEME;
  }
}

/** Inline bootstrap script source for app.html (must stay in sync with constants above). */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){var t='orange';try{var s=localStorage.getItem('${THEME_LOCALSTORAGE_KEY}');if(s==='dark'||s==='light'||s==='orange')t=s;}catch(e){}document.documentElement.dataset.theme=t;})();`;
