export const APP_THEMES = ['orange', 'dark', 'light'] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export const DEFAULT_APP_THEME: AppTheme = 'orange';

export const APP_THEME_LABELS: Record<AppTheme, string> = {
  orange: 'Orange',
  dark: 'Dark',
  light: 'Light'
};

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === 'string' && (APP_THEMES as readonly string[]).includes(value);
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}
