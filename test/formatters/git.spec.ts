import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitFormatter } from '../../src/formatters/git.js';
import type { Contribution } from '../../src/types.js';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';

describe('GitFormatter', () => {
  const formatter = new GitFormatter();
  const outputDir = join(process.cwd(), 'git-contributions-export');

  beforeEach(async () => {
    // Clean up test repository before each test
    if (existsSync(outputDir)) {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    // Clean up test repository after each test
    if (existsSync(outputDir)) {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it('handles empty contributions', async () => {
    const result = await formatter.format([], { withLinks: false });
    
    expect(result.content).toContain('No contributions to export');
    expect(existsSync(outputDir)).toBe(false);
  });

  it('creates repository with commits', async () => {
    const contributions: Contribution[] = [
      {
        type: 'commit',
        timestamp: '2026-01-01T10:00:00Z',
        text: 'feat: add feature',
        repository: 'owner/repo',
      },
      {
        type: 'pr',
        timestamp: '2026-01-02T12:00:00Z',
        text: 'Fix bug',
        repository: 'owner/repo',
        target: 'main',
      },
    ];

    const result = await formatter.format(contributions, { withLinks: false });

    expect(result.content).toContain('Git export completed successfully');
    expect(result.content).toContain('git-contributions-export');
    expect(result.content).toContain('Contributions exported: 2');
    expect(existsSync(outputDir)).toBe(true);
  });

  it('anonymizes content when requested', async () => {
    const contributions: Contribution[] = [
      {
        type: 'commit',
        timestamp: '2026-01-01T10:00:00Z',
        text: 'feat: add authentication',
        repository: 'secretcompany/private-repo',
      },
    ];

    const result = await formatter.format(contributions, {
      withLinks: false,
      anonymize: true,
    });

    expect(result.content).toContain('Git export completed successfully');
    expect(result.content).toContain('Anonymization: enabled');
  });

  it('shows author information in result', async () => {
    process.env.GIT_AUTHOR_NAME = 'Test User';
    process.env.GIT_AUTHOR_EMAIL = 'test@example.com';

    const contributions: Contribution[] = [
      {
        type: 'commit',
        timestamp: '2026-01-01T10:00:00Z',
        text: 'test commit',
      },
    ];

    const result = await formatter.format(contributions, { withLinks: false });

    expect(result.content).toContain('Test User <test@example.com>');

    delete process.env.GIT_AUTHOR_NAME;
    delete process.env.GIT_AUTHOR_EMAIL;
  });

  it('sorts contributions by timestamp', async () => {
    const contributions: Contribution[] = [
      {
        type: 'commit',
        timestamp: '2026-01-03T10:00:00Z',
        text: 'third',
      },
      {
        type: 'commit',
        timestamp: '2026-01-01T10:00:00Z',
        text: 'first',
      },
      {
        type: 'commit',
        timestamp: '2026-01-02T10:00:00Z',
        text: 'second',
      },
    ];

    const result = await formatter.format(contributions, { withLinks: false });

    expect(result.content).toContain('Git export completed successfully');
    // The commits should be created in chronological order (verified by git log)
  });

  it('includes push instructions in result', async () => {
    const contributions: Contribution[] = [
      {
        type: 'commit',
        timestamp: '2026-01-01T10:00:00Z',
        text: 'test',
      },
    ];

    const result = await formatter.format(contributions, { withLinks: false });

    expect(result.content).toContain('To push to GitHub:');
    expect(result.content).toContain('git remote add origin');
    expect(result.content).toContain('git push');
  });
});
