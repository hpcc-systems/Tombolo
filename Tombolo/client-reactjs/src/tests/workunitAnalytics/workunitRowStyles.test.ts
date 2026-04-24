import { describe, it, expect } from 'vitest';
import {
  DASHBOARD_FAILED_ROW_CLASS,
  getDashboardFailedRowClass,
} from '@/components/admin/workunits/dashboard/cards/workunitRowStyles';

describe('getDashboardFailedRowClass', () => {
  it('returns the dashboard failed-row class only for failed state', () => {
    expect(getDashboardFailedRowClass('failed')).toBe(DASHBOARD_FAILED_ROW_CLASS);
    expect(getDashboardFailedRowClass('running')).toBe('');
    expect(getDashboardFailedRowClass('aborted')).toBe('');
    expect(getDashboardFailedRowClass(undefined)).toBe('');
  });
});
