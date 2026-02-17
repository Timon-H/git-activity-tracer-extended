import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import type { Contribution, FormatterOptions, FormatterResult } from '../types.js';
import type { Formatter } from './types.js';
import { anonymizeMessage, anonymizeRepository } from '../lib/git/anonymizer.js';

dayjs.extend(utc);

export class ConsoleFormatter implements Formatter {
  format(contributions: Contribution[], options: FormatterOptions): FormatterResult {
    if (contributions.length === 0) {
      return { content: 'No contributions found in this range' };
    }

    const sorted = [...contributions].sort(
      (a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf(),
    );

    const byDate = new Map<string, Contribution[]>();
    for (const item of sorted) {
      const date = dayjs.utc(item.timestamp).format('YYYY-MM-DD');
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(item);
    }

    const lines: string[] = [];
    for (const [date, list] of byDate) {
      lines.push(`\n## ${date}`);
      for (const contribution of list) {
        const timestamp = dayjs.utc(contribution.timestamp).format('HH:mm:ss');
        const parts = [contribution.type, timestamp];
        if (contribution.repository) {
          const repo = options.anonymize
            ? anonymizeRepository(contribution.repository)
            : contribution.repository;
          parts.push(`[${repo}]`);
        }
        if (contribution.projectId) {
          parts.push(`{${contribution.projectId}}`);
        }
        if (contribution.target) {
          parts.push(`(${contribution.target})`);
        }
        if (contribution.text) {
          const text = options.anonymize
            ? anonymizeMessage(contribution.text)
            : contribution.text;
          parts.push(text);
        }
        if (options.withLinks && contribution.url) {
          parts.push(`(${contribution.url})`);
        }
        lines.push(parts.join(': '));
      }
    }

    return { content: lines.join('\n') };
  }
}
