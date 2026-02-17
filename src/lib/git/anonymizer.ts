import { createHash } from 'crypto';

/**
 * Creates a consistent hash for a given input string.
 * Same input will always produce the same hash.
 *
 * @param input - String to hash
 * @param length - Length of hash to return (default: 8)
 * @returns Truncated hash string
 */
const createConsistentHash = (input: string, length = 8): string => {
  return createHash('sha256').update(input).digest('hex').substring(0, length);
};

/**
 * Anonymizes a commit message while preserving structure.
 * Keeps conventional commit prefixes (feat:, fix:, etc.) and replaces content with hash.
 *
 * @param message - Original commit message
 * @returns Anonymized message
 *
 * @example
 * anonymizeMessage('feat: add user authentication')
 * // Returns: 'feat: hash_abc12345'
 *
 * @example
 * anonymizeMessage('fix the login bug')
 * // Returns: 'hash_def67890'
 */
export const anonymizeMessage = (message: string | undefined): string => {
  if (!message) {
    return 'hash_' + createConsistentHash('empty');
  }

  // Check for conventional commit prefixes
  const conventionalPrefixPattern = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\([\w-]+\))?:\s*/i;
  const match = message.match(conventionalPrefixPattern);

  if (match) {
    const prefix = match[0];
    const content = message.substring(prefix.length);
    return prefix + 'hash_' + createConsistentHash(content);
  }

  // No conventional prefix, just hash everything
  return 'hash_' + createConsistentHash(message);
};

/**
 * Anonymizes a repository name.
 * Converts 'owner/repository' to 'repo_hash123456'.
 *
 * @param repository - Repository name (e.g., 'owner/repo')
 * @returns Anonymized repository name
 *
 * @example
 * anonymizeRepository('facebook/react')
 * // Returns: 'repo_a1b2c3d4'
 */
export const anonymizeRepository = (repository: string | undefined): string => {
  if (!repository) {
    return 'repo_' + createConsistentHash('unknown');
  }

  return 'repo_' + createConsistentHash(repository);
};

/**
 * Anonymizes a contribution type-specific text.
 * Used for commit messages, PR titles, review comments, etc.
 *
 * @param text - Text to anonymize
 * @param type - Type of contribution (for context-aware anonymization)
 * @returns Anonymized text
 */
export const anonymizeText = (text: string | undefined, type: 'commit' | 'pr' | 'review'): string => {
  if (!text) {
    return `${type}_hash_` + createConsistentHash(`${type}_empty`);
  }

  // For commits, use the message anonymizer which preserves conventional commit prefixes
  if (type === 'commit') {
    return anonymizeMessage(text);
  }

  // For PRs and reviews, simple hash
  return `${type}_hash_` + createConsistentHash(text);
};
