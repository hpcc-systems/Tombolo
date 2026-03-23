import { findFuzzyMatches, FuzzyMatchOptions, FuzzyMatchResult } from '@tombolo/shared';

// Group workunits by similar job names using fuzzy matching from shared package
export function groupWorkunitsByName(workunits: any[], threshold = 0.8): { [key: string]: any[] } {
  const groups: { [key: string]: any[] } = {};
  const processed = new Set<string>();

  workunits.forEach(wu => {
    if (!wu.jobName || processed.has(wu.wuId)) return;

    // Use the first occurrence as the group key
    const groupKey = wu.jobName;

    // Find all similar job names to this workunit
    const unprocessedWorkunits = workunits.filter(w => w.jobName && !processed.has(w.wuId));

    // Use shared fuzzy matching utility
    const similarJobs = findFuzzyMatches(wu.jobName, unprocessedWorkunits, w => w.jobName, {
      minSimilarity: threshold,
    });

    // Create group with similar jobs
    groups[groupKey] = similarJobs.map(result => result.item);

    // Mark all items in this group as processed
    similarJobs.forEach(result => processed.add(result.item.wuId));
  });
  return groups;
}

// Re-export types for convenience
export type { FuzzyMatchOptions, FuzzyMatchResult };
