import { describe, it, expect } from 'vitest';
import { anonymizeMessage, anonymizeRepository, anonymizeText } from '../../src/lib/git/anonymizer.js';

describe('anonymizer', () => {
  describe('anonymizeMessage', () => {
    it('preserves conventional commit prefix', () => {
      const result = anonymizeMessage('feat: add new feature');
      expect(result).toMatch(/^feat: hash_[a-f0-9]{8}$/);
    });

    it('preserves conventional commit prefix with scope', () => {
      const result = anonymizeMessage('fix(auth): resolve login issue');
      expect(result).toMatch(/^fix\(auth\): hash_[a-f0-9]{8}$/);
    });

    it('hashes message without conventional prefix', () => {
      const result = anonymizeMessage('some random commit message');
      expect(result).toMatch(/^hash_[a-f0-9]{8}$/);
    });

    it('handles empty message', () => {
      const result = anonymizeMessage('');
      expect(result).toMatch(/^hash_[a-f0-9]{8}$/);
    });

    it('handles undefined message', () => {
      const result = anonymizeMessage(undefined);
      expect(result).toMatch(/^hash_[a-f0-9]{8}$/);
    });

    it('produces consistent hashes for same input', () => {
      const message = 'feat: add authentication';
      const result1 = anonymizeMessage(message);
      const result2 = anonymizeMessage(message);
      expect(result1).toBe(result2);
    });

    it('produces different hashes for different inputs', () => {
      const result1 = anonymizeMessage('feat: add feature A');
      const result2 = anonymizeMessage('feat: add feature B');
      expect(result1).not.toBe(result2);
    });

    it('handles various conventional commit types', () => {
      const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'build', 'ci', 'revert'];
      
      for (const type of types) {
        const result = anonymizeMessage(`${type}: some change`);
        expect(result).toMatch(new RegExp(`^${type}: hash_[a-f0-9]{8}$`));
      }
    });

    it('handles uppercase conventional commits', () => {
      const result = anonymizeMessage('FEAT: add feature');
      expect(result).toMatch(/^FEAT: hash_[a-f0-9]{8}$/);
    });
  });

  describe('anonymizeRepository', () => {
    it('anonymizes repository name', () => {
      const result = anonymizeRepository('owner/repository');
      expect(result).toMatch(/^repo_[a-f0-9]{8}$/);
    });

    it('handles undefined repository', () => {
      const result = anonymizeRepository(undefined);
      expect(result).toMatch(/^repo_[a-f0-9]{8}$/);
    });

    it('produces consistent hashes for same repository', () => {
      const repo = 'facebook/react';
      const result1 = anonymizeRepository(repo);
      const result2 = anonymizeRepository(repo);
      expect(result1).toBe(result2);
    });

    it('produces different hashes for different repositories', () => {
      const result1 = anonymizeRepository('facebook/react');
      const result2 = anonymizeRepository('vuejs/vue');
      expect(result1).not.toBe(result2);
    });
  });

  describe('anonymizeText', () => {
    it('uses message anonymizer for commit type', () => {
      const result = anonymizeText('feat: add feature', 'commit');
      expect(result).toMatch(/^feat: hash_[a-f0-9]{8}$/);
    });

    it('hashes PR text with type prefix', () => {
      const result = anonymizeText('Fix authentication bug', 'pr');
      expect(result).toMatch(/^pr_hash_[a-f0-9]{8}$/);
    });

    it('hashes review text with type prefix', () => {
      const result = anonymizeText('LGTM', 'review');
      expect(result).toMatch(/^review_hash_[a-f0-9]{8}$/);
    });

    it('handles empty text', () => {
      const result = anonymizeText('', 'commit');
      expect(result).toMatch(/^commit_hash_[a-f0-9]{8}$/);
    });

    it('handles undefined text', () => {
      const result = anonymizeText(undefined, 'pr');
      expect(result).toMatch(/^pr_hash_[a-f0-9]{8}$/);
    });

    it('produces consistent hashes', () => {
      const text = 'Some text';
      const result1 = anonymizeText(text, 'pr');
      const result2 = anonymizeText(text, 'pr');
      expect(result1).toBe(result2);
    });
  });
});
