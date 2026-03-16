import { apiClient } from '@/services/api';

const analyticsService = {
  executeQuery: async (sql: string, options: { clusterId?: string; limit?: number } = {}): Promise<any> => {
    const response = await apiClient.post('/workunitAnalytics/query', {
      sql,
      options,
    });
    return response.data;
  },

  getSchema: async (): Promise<any[]> => {
    const response = await apiClient.get('/workunitAnalytics/schema');
    return response.data;
  },

  exportToCSV: (results: { columns: string[]; rows: any[] }, filename = 'query-results'): void => {
    if (!results || !results.rows || results.rows.length === 0) {
      throw new Error('No data to export');
    }

    const headers = results.columns.join(',');
    const rows = results.rows
      .map(row =>
        results.columns
          .map(col => {
            const value = row[col];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(',')
      )
      .join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },

  exportToJSON: (results: { rows: any[] }, filename = 'query-results'): void => {
    if (!results || !results.rows || results.rows.length === 0) {
      throw new Error('No data to export');
    }

    const json = JSON.stringify(results.rows, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  analyzeQuery: async (sql: string): Promise<any> => {
    const response = await apiClient.post('/workunitAnalytics/analyze', { sql });
    return response.data;
  },

  getDatabaseStats: async (): Promise<any> => {
    const response = await apiClient.get('/workunitAnalytics/stats');
    return response.data;
  },
};

export { analyticsService };
