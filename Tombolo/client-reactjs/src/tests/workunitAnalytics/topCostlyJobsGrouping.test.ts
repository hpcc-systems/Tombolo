import { describe, it, expect } from 'vitest';
import {
  buildJobGroupsForTopCostlyJobs,
  formatStateLabel,
  getGroupStateLabel,
} from '@/components/admin/workunits/dashboard/cards/TopCostlyJobs';
import type { ExpensiveWorkunit } from '@/services/workunitDashboard.service';

const makeWorkunit = (overrides: Partial<ExpensiveWorkunit>): ExpensiveWorkunit => ({
  wuId: overrides.wuId || 'W20260423-000000',
  jobName: Object.prototype.hasOwnProperty.call(overrides, 'jobName') ? overrides.jobName : 'Default Job',
  clusterId: overrides.clusterId || 'cluster-1',
  owner: overrides.owner || 'owner-a',
  state: overrides.state || 'completed',
  totalCost: overrides.totalCost ?? 1,
  executeCost: overrides.executeCost ?? 1,
  fileAccessCost: overrides.fileAccessCost ?? 0,
  compileCost: overrides.compileCost ?? 0,
  totalClusterTime: overrides.totalClusterTime ?? 1,
  workUnitTimestamp: overrides.workUnitTimestamp || '2026-04-23T10:00:00.000Z',
  detailsFetchedAt: overrides.detailsFetchedAt ?? '2026-04-23T10:01:00.000Z',
});

describe('buildJobGroupsForTopCostlyJobs', () => {
  it('includes unnamed singles and sorts top-level rows by total cost', () => {
    const workunits: ExpensiveWorkunit[] = [
      makeWorkunit({ wuId: 'W1', jobName: 'Nightly ETL', totalCost: 30, state: 'completed' }),
      makeWorkunit({ wuId: 'W2', jobName: 'Nightly ETL', totalCost: 20, state: 'failed' }),
      makeWorkunit({ wuId: 'W3', jobName: '', totalCost: 70, state: 'failed' }),
      makeWorkunit({ wuId: 'W4', jobName: undefined, totalCost: 5, state: 'running' }),
    ];

    const groups = buildJobGroupsForTopCostlyJobs(workunits);

    expect(groups).toHaveLength(3);
    expect(groups.map(group => group.totalCost)).toEqual([70, 50, 5]);
    expect(groups.map(group => group.groupName)).toEqual(['W3', 'Nightly ETL', 'W4']);

    expect(groups[0].count).toBe(1);
    expect(groups[0].workunits[0].wuId).toBe('W3');
    expect(groups[0].isNoJobNameSingleton).toBe(true);

    expect(groups[1].count).toBe(2);
    expect(groups[1].stateLabel).toBe('mixed');
    expect(groups[1].isNoJobNameSingleton).toBe(false);

    expect(groups[2].isNoJobNameSingleton).toBe(true);
  });

  it('ranks by grouped total cost, not by highest individual workunit', () => {
    const workunits: ExpensiveWorkunit[] = [
      makeWorkunit({ wuId: 'W10', jobName: 'Grouped Job', totalCost: 40, state: 'completed' }),
      makeWorkunit({ wuId: 'W11', jobName: 'Grouped Job', totalCost: 35, state: 'completed' }),
      makeWorkunit({ wuId: 'W12', jobName: undefined, totalCost: 70, state: 'failed' }),
    ];

    const groups = buildJobGroupsForTopCostlyJobs(workunits);

    expect(groups[0].groupName).toBe('Grouped Job');
    expect(groups[0].totalCost).toBe(75);
    expect(groups[0].count).toBe(2);
    expect(groups[0].isNoJobNameSingleton).toBe(false);

    expect(groups[1].groupName).toBe('W12');
    expect(groups[1].totalCost).toBe(70);
    expect(groups[1].count).toBe(1);
    expect(groups[1].isNoJobNameSingleton).toBe(true);
  });
});

describe('group state labeling', () => {
  it('returns mixed for mixed groups and preserves exact state for homogeneous groups', () => {
    const mixedState = getGroupStateLabel([
      makeWorkunit({ wuId: 'WA', state: 'completed' }),
      makeWorkunit({ wuId: 'WB', state: 'failed' }),
    ]);
    const singleState = getGroupStateLabel([makeWorkunit({ wuId: 'WC', state: 'running' })]);

    expect(mixedState).toBe('mixed');
    expect(singleState).toBe('running');
  });

  it('formats state labels for display', () => {
    expect(formatStateLabel('mixed')).toBe('Mixed');
    expect(formatStateLabel('failed')).toBe('Failed');
    expect(formatStateLabel(undefined)).toBe('Unknown');
  });
});
