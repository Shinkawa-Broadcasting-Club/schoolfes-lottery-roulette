import { describe, expect, it } from 'vitest';
import { createDefaultSettings, createDefaultPrizes, createEmptyResults } from '$lib/lottery';
import { serializeSettings, parseStoredSettings } from '$lib/storage/settingsStorage';
import { serializeResults, parseStoredResults } from '$lib/storage/resultsStorage';
import { serializeProjectIndex, parseStoredProjectIndex } from '$lib/storage/projectsStorage';
import { createProjectMeta } from '$lib/project';

describe('settings storage', () => {
  it('round-trips versioned settings', () => {
    const settings = createDefaultSettings();
    settings.digitRevealOrder = 'hundreds-first';
    settings.theme = 'dark';
    settings.prizes = ['特賞', 'A賞'];

    const parsed = parseStoredSettings(serializeSettings(settings));
    expect(parsed).toEqual(settings);
  });

  it('still parses legacy settings object without version', () => {
    expect(
      parseStoredSettings(
        JSON.stringify({
          prizes: ['1等', '2等'],
          digitRevealOrder: 'ones-first',
          theme: 'orange'
        })
      )
    ).toEqual({
      prizes: ['1等', '2等'],
      digitRevealOrder: 'ones-first',
      theme: 'orange'
    });
  });
});

describe('results storage', () => {
  it('round-trips versioned results', () => {
    const prizes = createDefaultPrizes().slice(0, 2);
    const results = createEmptyResults(prizes);
    results['1等'] = [7, 8];
    results['2等'] = [9];

    const parsed = parseStoredResults(serializeResults(results), prizes);
    expect(parsed).toEqual(results);
  });

  it('still parses legacy flat results object', () => {
    const prizes = ['1等', '2等'];
    const parsed = parseStoredResults(JSON.stringify({ '1等': [7], '2等': [9] }), prizes);
    expect(parsed).toEqual({ '1等': [7], '2等': [9] });
  });
});

describe('projects storage', () => {
  it('round-trips versioned project index', () => {
    const project = createProjectMeta('Test');
    const raw = serializeProjectIndex({ projects: [project] });
    expect(parseStoredProjectIndex(raw).projects).toEqual([project]);
  });

  it('still parses legacy project index without version', () => {
    const project = createProjectMeta('Legacy');
    const raw = JSON.stringify({ projects: [project] });
    expect(parseStoredProjectIndex(raw).projects).toEqual([project]);
  });
});
