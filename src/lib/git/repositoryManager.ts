import { simpleGit, type SimpleGit } from 'simple-git';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface CommitOptions {
  message: string;
  authorName: string;
  authorEmail: string;
  date: Date;
}

/**
 * Manages git repository operations for exporting contributions.
 * Creates repositories and commits with custom author information and timestamps.
 */
export class RepositoryManager {
  private git: SimpleGit;
  private repositoryPath: string;

  /**
   * Creates a new RepositoryManager instance.
   *
   * @param repositoryPath - Path where the git repository should be created
   */
  constructor(repositoryPath: string) {
    this.repositoryPath = repositoryPath;
    
    // Create directory if it doesn't exist (required for simpleGit initialization)
    if (!existsSync(repositoryPath)) {
      mkdirSync(repositoryPath, { recursive: true });
    }
    
    // Initialize simpleGit with the repository path so all operations target that directory
    this.git = simpleGit(repositoryPath);
  }

  /**
   * Initializes a new git repository or opens an existing one.
   *
   * @returns true if a new repository was created, false if it already existed
   * @throws Error if git is not installed or initialization fails
   */
  async initializeRepository(): Promise<boolean> {
    // Check if already a git repository by looking for .git directory
    // We can't use checkIsRepo() because it might find a parent repository
    const gitDir = join(this.repositoryPath, '.git');
    const isRepo = existsSync(gitDir);

    if (isRepo) {
      return false; // Already exists
    }

    // Initialize new repository
    await this.git.init();

    // Configure the repository to allow empty commits
    await this.git.addConfig('commit.gpgsign', 'false');

    return true; // New repository created
  }

  /**
   * Creates a commit with custom author, date, and message.
   * Commits are empty (no file changes) - just for contribution graph.
   *
   * @param options - Commit options including message, author, and date
   * @throws Error if commit fails
   */
  async createCommit(options: CommitOptions): Promise<void> {
    const { message, authorName, authorEmail, date } = options;

    // Create an empty commit with custom author and committer dates
    // We need to set both dates so GitHub shows the correct contribution date
    const authorString = `${authorName} <${authorEmail}>`;
    const dateString = date.toISOString();

    // Save original environment variables
    const originalEnv = {
      GIT_AUTHOR_DATE: process.env.GIT_AUTHOR_DATE,
      GIT_COMMITTER_DATE: process.env.GIT_COMMITTER_DATE,
      GIT_COMMITTER_NAME: process.env.GIT_COMMITTER_NAME,
      GIT_COMMITTER_EMAIL: process.env.GIT_COMMITTER_EMAIL,
    };

    try {
      // Set environment variables for this commit
      process.env.GIT_AUTHOR_DATE = dateString;
      process.env.GIT_COMMITTER_DATE = dateString;
      process.env.GIT_COMMITTER_NAME = authorName;
      process.env.GIT_COMMITTER_EMAIL = authorEmail;

      await this.git.raw([
        'commit',
        '--allow-empty',
        '--message',
        message,
        '--author',
        authorString,
      ]);
    } finally {
      // Restore original environment variables
      this.restoreEnvironmentVariables(originalEnv);
    }
  }

  /**
   * Restores environment variables to their original state.
   * Deletes variables that were not originally set.
   *
   * @param original - Original environment variable values
   */
  private restoreEnvironmentVariables(original: Record<string, string | undefined>): void {
    for (const [key, value] of Object.entries(original)) {
      if (value !== undefined) {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    }
  }

  /**
   * Gets the total number of commits in the repository.
   *
   * @returns Number of commits, or 0 if repository is empty
   */
  async getCommitCount(): Promise<number> {
    try {
      const log = await this.git.log();
      return log.total;
    } catch (error) {
      // Repository might be empty or not initialized
      return 0;
    }
  }

  /**
   * Checks if git is installed and available.
   *
   * @returns true if git is available, false otherwise
   */
  static async isGitAvailable(): Promise<boolean> {
    try {
      const git = simpleGit();
      await git.version();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets the path to the repository.
   *
   * @returns Repository path
   */
  getRepositoryPath(): string {
    return this.repositoryPath;
  }
}
