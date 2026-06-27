import { describe, expect, it } from 'vitest';
import {
  createProjectMeta,
  formatProjectDate,
  parseProjectIndex,
  sortProjectsByLastOpened
} from './project';

describe('parseProjectIndex', () => {
  it('returns empty projects for invalid payload', () => {
    expect(parseProjectIndex(null)).toEqual({ projects: [] });
    expect(parseProjectIndex('[]')).toEqual({ projects: [] });
    expect(parseProjectIndex(JSON.stringify({ projects: [{}] }))).toEqual({ projects: [] });
  });

  it('keeps only valid project metadata entries', () => {
    const valid = createProjectMeta('A');
    const parsed = parseProjectIndex(
      JSON.stringify({
        projects: [
          valid,
          {
            id: 'missing-created-at',
            name: 'Invalid',
            lastOpenedAt: new Date().toISOString()
          }
        ]
      })
    );
    expect(parsed.projects).toEqual([valid]);
  });
});

describe('sortProjectsByLastOpened', () => {
  it('sorts by lastOpenedAt descending and tolerates invalid dates', () => {
    const projects = [
      {
        id: 'a',
        name: 'A',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastOpenedAt: 'invalid-date'
      },
      {
        id: 'b',
        name: 'B',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastOpenedAt: '2026-06-01T00:00:00.000Z'
      }
    ];

    expect(sortProjectsByLastOpened(projects).map((project) => project.id)).toEqual(['b', 'a']);
  });
});

describe('formatProjectDate', () => {
  it('returns original string when date is invalid', () => {
    expect(formatProjectDate('not-a-date')).toBe('not-a-date');
  });
});
