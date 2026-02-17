import type { Contribution, FormatterOptions, FormatterResult } from '../types.js';
import type { Formatter } from './types.js';
import { RepositoryManager } from '../lib/git/repositoryManager.js';
import { anonymizeMessage, anonymizeRepository } from '../lib/git/anonymizer.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { join } from 'path';

dayjs.extend(utc);

/**
 * GitFormatter creates a git repository with commits representing contributions.
 * This allows populating GitHub's contribution graph with activity from GitLab and other platforms.
 */
export class GitFormatter implements Formatter {
  private readonly defaultAuthorName = 'Git Activity Tracer';
  private readonly defaultAuthorEmail = 'noreply@example.com';
  private readonly outputDirectory = 'git-contributions-export';

  /**
   * Formats contributions as git commits in a local repository.
   *
   * @param contributions - Array of contributions to export
   * @param options - Formatter options including anonymization
   * @returns Result with summary message
   */
  async format(contributions: Contribution[], options: FormatterOptions): Promise<FormatterResult> {
    // Check if git is available
    const gitAvailable = await RepositoryManager.isGitAvailable();
    if (!gitAvailable) {
      throw new Error(
        'Git is not installed or not available in PATH. Please install git to use the git export format.',
      );
    }

    if (contributions.length === 0) {
      return {
        content:
          'No contributions to export. The repository was not created because there are no contributions in this range.',
      };
    }

    // Get author information from environment variables
    const authorName = process.env.GIT_AUTHOR_NAME || this.defaultAuthorName;
    const authorEmail = process.env.GIT_AUTHOR_EMAIL || this.defaultAuthorEmail;

    // Create repository path
    const repositoryPath = join(process.cwd(), this.outputDirectory);
    const repoManager = new RepositoryManager(repositoryPath);

    // Initialize repository
    const isNew = await repoManager.initializeRepository();
    const initialCount = isNew ? 0 : await repoManager.getCommitCount();

    // Sort contributions by timestamp (oldest first)
    const sorted = [...contributions].sort(
      (a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf(),
    );

    // Create commits
    let commitCount = 0;
    for (const contribution of sorted) {
      const message = this.buildCommitMessage(contribution, options.anonymize ?? false);
      const date = new Date(contribution.timestamp);

      try {
        await repoManager.createCommit({
          message,
          authorName,
          authorEmail,
          date,
        });
        commitCount++;

        // Progress indicator for large exports
        if (commitCount % 100 === 0) {
          console.log(`  Progress: ${commitCount}/${sorted.length} commits created...`);
        }
      } catch (error) {
        console.warn(
          `Warning: Failed to create commit for ${contribution.type} at ${contribution.timestamp}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    const totalCommits = await repoManager.getCommitCount();
    const newCommits = totalCommits - initialCount;

    // Build summary message
    const lines: string[] = [];
    lines.push(`\n✅ Git export completed successfully!\n`);
    lines.push(`Repository location: ${repositoryPath}`);
    lines.push(`Total commits: ${totalCommits}`);
    lines.push(`New commits created: ${newCommits}`);
    lines.push(`Contributions exported: ${contributions.length}`);
    lines.push(`Author: ${authorName} <${authorEmail}>`);

    if (options.anonymize) {
      lines.push(`Anonymization: enabled`);
    }

    lines.push(`\nTo push to GitHub:`);
    lines.push(`  cd ${this.outputDirectory}`);
    lines.push(`  git remote add origin git@github.com:username/activity-showcase.git`);
    lines.push(`  git branch -M main`);
    lines.push(`  git push -u origin main --force`);

    return {
      content: lines.join('\n'),
    };
  }

  /**
   * Builds a commit message from a contribution.
   *
   * @param contribution - Contribution to convert to commit message
   * @param anonymize - Whether to anonymize the message
   * @returns Commit message
   */
  private buildCommitMessage(contribution: Contribution, anonymize: boolean): string {
    const parts: string[] = [];

    // Add type prefix
    parts.push(`[${contribution.type}]`);

    // Add repository (anonymized if needed)
    if (contribution.repository) {
      const repo = anonymize ? anonymizeRepository(contribution.repository) : contribution.repository;
      parts.push(repo);
    }

    // Add target branch if available
    if (contribution.target) {
      parts.push(`(${contribution.target})`);
    }

    // Add project ID if available
    if (contribution.projectId) {
      parts.push(`{${contribution.projectId}}`);
    }

    // Add main text (anonymized if needed)
    if (contribution.text) {
      const text = anonymize ? anonymizeMessage(contribution.text) : contribution.text;
      parts.push(text);
    }

    // Format: [type] repository (branch) {projectId}: message
    // Example: [commit] owner/repo (main) {PROJECT-123}: feat: add feature
    // Example anonymized: [commit] repo_abc123 (main): feat: hash_xyz789
    return parts.join(': ');
  }
}
