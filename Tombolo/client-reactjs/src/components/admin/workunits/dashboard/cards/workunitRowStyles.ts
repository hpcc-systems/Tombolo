export const DASHBOARD_FAILED_ROW_CLASS = 'dashboard-wu-row-failed';

export const getDashboardFailedRowClass = (state?: string): string => {
  if (state === 'failed') {
    return DASHBOARD_FAILED_ROW_CLASS;
  }
  return '';
};
