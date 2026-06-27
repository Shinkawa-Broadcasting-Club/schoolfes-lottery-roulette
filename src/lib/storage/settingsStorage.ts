import {
  createDefaultSettings,
  isDigitRevealOrder,
  type DigitRevealOrder,
  type LotterySettings
} from '$lib/lottery';
import { DEFAULT_APP_THEME, isAppTheme } from '$lib/theme';
import { parsePrizesFromUnknown, parseStoredPrizes } from './prizesParser';

export const SETTINGS_SCHEMA_VERSION = 1;

type SettingsPayloadV1 = {
  version: typeof SETTINGS_SCHEMA_VERSION;
  prizes: LotterySettings['prizes'];
  digitRevealOrder: DigitRevealOrder;
  theme: LotterySettings['theme'];
};

export function serializeSettings(settings: LotterySettings): string {
  const payload: SettingsPayloadV1 = {
    version: SETTINGS_SCHEMA_VERSION,
    prizes: settings.prizes,
    digitRevealOrder: settings.digitRevealOrder,
    theme: settings.theme
  };
  return JSON.stringify(payload);
}

function parseLegacySettingsObject(record: Record<string, unknown>): LotterySettings | null {
  const prizes = parsePrizesFromUnknown(record.prizes);
  if (!prizes) return null;

  const digitRevealOrder: DigitRevealOrder = isDigitRevealOrder(record.digitRevealOrder)
    ? record.digitRevealOrder
    : 'ones-first';
  const theme = isAppTheme(record.theme) ? record.theme : DEFAULT_APP_THEME;

  return { prizes, digitRevealOrder, theme };
}

function parseVersionedSettings(record: Record<string, unknown>): LotterySettings | null {
  const version = record.version;
  if (version !== SETTINGS_SCHEMA_VERSION) return null;
  return parseLegacySettingsObject(record);
}

export function parseStoredSettings(raw: string | null): LotterySettings | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      const prizes = parsePrizesFromUnknown(parsed);
      if (!prizes) return null;
      return { ...createDefaultSettings(), prizes };
    }

    if (typeof parsed !== 'object' || parsed === null) return null;

    const record = parsed as Record<string, unknown>;
    if (record.version === SETTINGS_SCHEMA_VERSION) {
      return parseVersionedSettings(record);
    }

    return parseLegacySettingsObject(record);
  } catch {
    return null;
  }
}

export { parseStoredPrizes };
