import { describe, expect, it } from 'vitest';
import { applySavedResultsRetentionPolicy, getSerializedByteSize } from '@/components/admin/workunits/analytics/utils';

describe('saved results retention helpers', () => {
  it('measures serialized payload size in bytes', () => {
    const payload = { sql: 'SELECT 1', rows: [{ id: 1 }] };
    const expected = new TextEncoder().encode(JSON.stringify(payload)).length;

    expect(getSerializedByteSize(payload)).toBe(expected);
  });

  it('enforces max item count before byte eviction', () => {
    const entries = [
      { id: 1, sizeBytes: 40 },
      { id: 2, sizeBytes: 30 },
      { id: 3, sizeBytes: 20 },
    ];

    const retained = applySavedResultsRetentionPolicy(entries, {
      maxItems: 2,
      maxTotalBytes: 1_000,
    });

    expect(retained.entries.map(entry => entry.id)).toEqual([1, 2]);
    expect(retained.evictedCount).toBe(1);
    expect(retained.totalBytes).toBe(70);
  });

  it('evicts oldest entries when total bytes exceed the cap', () => {
    const entries = [
      { id: 10, sizeBytes: 350 },
      { id: 11, sizeBytes: 300 },
      { id: 12, sizeBytes: 250 },
    ];

    const retained = applySavedResultsRetentionPolicy(entries, {
      maxItems: 10,
      maxTotalBytes: 700,
    });

    expect(retained.entries.map(entry => entry.id)).toEqual([10, 11]);
    expect(retained.evictedCount).toBe(1);
    expect(retained.totalBytes).toBe(650);
  });

  it('returns an empty list when max item cap is zero', () => {
    const entries = [{ id: 1, sizeBytes: 100 }];

    const retained = applySavedResultsRetentionPolicy(entries, {
      maxItems: 0,
      maxTotalBytes: 100,
    });

    expect(retained.entries).toEqual([]);
    expect(retained.evictedCount).toBe(1);
    expect(retained.totalBytes).toBe(0);
  });
});
