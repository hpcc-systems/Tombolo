import { describe, expect, it } from 'vitest';
import {
  applyScopeToSelect,
  parseAndValidateAnalyticsSql,
  sqlifySelect,
} from '../../utils/workunitAnalyticsSqlAst.js';
import { SCOPEABLE_WORKUNIT_ANALYTICS_TABLE_SET } from '../../config/workunitAnalyticsPolicy.js';

type ColumnRef = {
  type?: string;
  table?: string | null;
  column?: string | null;
};

function collectColumnRefs(node: unknown, refs: ColumnRef[] = []): ColumnRef[] {
  if (node === null || node === undefined) {
    return refs;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectColumnRefs(item, refs);
    }
    return refs;
  }

  if (typeof node !== 'object') {
    return refs;
  }

  const candidate = node as ColumnRef;
  if (candidate.type === 'column_ref') {
    refs.push(candidate);
  }

  for (const value of Object.values(node)) {
    collectColumnRefs(value, refs);
  }

  return refs;
}

describe('workunitAnalyticsSqlAst scoped alias-aware injection', () => {
  it('qualifies scope columns only for the initial from table alias', () => {
    const parsed = parseAndValidateAnalyticsSql(
      'SELECT d.wuId, w.clusterId FROM work_unit_details d JOIN work_units w ON d.wuId = w.wuId'
    );

    const applied = applyScopeToSelect(parsed.ast, {
      scopeToWuid: 'W20260101-123456',
      scopeToClusterId: '58d5391a-ec05-4a64-97d3-e249bbba0bf0',
      scopeableTableSet: SCOPEABLE_WORKUNIT_ANALYTICS_TABLE_SET,
    });

    expect(applied).toBe(true);

    const whereRefs = collectColumnRefs(parsed.ast.where);
    const scopedColumnRefs = whereRefs.filter(
      ref => ref.column === 'wuId' || ref.column === 'clusterId'
    );

    const scopedTables = new Set(
      scopedColumnRefs
        .map(ref => ref.table)
        .filter((table): table is string => typeof table === 'string')
        .map(table => table.toLowerCase())
    );

    expect(scopedTables).toEqual(new Set(['d']));
  });

  it('preserves join/group by/count queries while scoping only the base table', () => {
    const parsed = parseAndValidateAnalyticsSql(
      "SELECT w.clusterId, COUNT(*) AS total FROM work_units w JOIN work_unit_details d ON d.wuId = w.wuId WHERE d.state = 'failed' GROUP BY w.clusterId"
    );

    const applied = applyScopeToSelect(parsed.ast, {
      scopeToWuid: 'W20260101-123456',
      scopeToClusterId: '58d5391a-ec05-4a64-97d3-e249bbba0bf0',
      scopeableTableSet: SCOPEABLE_WORKUNIT_ANALYTICS_TABLE_SET,
    });

    expect(applied).toBe(true);

    const whereRefs = collectColumnRefs(parsed.ast.where);
    const scopeRefs = whereRefs.filter(
      ref => ref.column === 'wuId' || ref.column === 'clusterId'
    );
    const scopedTables = new Set(
      scopeRefs
        .map(ref => ref.table)
        .filter((table): table is string => typeof table === 'string')
        .map(table => table.toLowerCase())
    );

    expect(scopedTables).toEqual(new Set(['w']));
    expect(parsed.ast.groupby).not.toBeNull();

    const sql = sqlifySelect(parsed.ast);
    expect(sql.toLowerCase()).toContain('count(*)');
    expect(sql.toLowerCase()).toContain('group by');
    expect(sql.toLowerCase()).toContain("`d`.`state` = 'failed'");
  });

  it('does not apply fallback unqualified scope when no scopeable table exists', () => {
    const parsed = parseAndValidateAnalyticsSql(
      'SELECT id, name FROM clusters'
    );

    const applied = applyScopeToSelect(parsed.ast, {
      scopeToWuid: 'W20260101-123456',
      scopeToClusterId: '58d5391a-ec05-4a64-97d3-e249bbba0bf0',
      scopeableTableSet: SCOPEABLE_WORKUNIT_ANALYTICS_TABLE_SET,
    });

    expect(applied).toBe(false);
  });
});
