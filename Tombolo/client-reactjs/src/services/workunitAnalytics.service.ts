import { apiClient } from '@/services/api';
import type { AxiosRequestConfig } from 'axios';

type QueryOptions = {
  clusterId?: string;
  limit?: number;
};

type ScopedQueryOptions = {
  scopeToWuid: string;
  scopeToClusterId: string;
  limit?: number;
};

type AnalyticsSchemaColumn = {
  name: string;
  type?: string;
  nullable?: string;
  key?: string;
  description?: string;
  ORDINAL_POSITION?: number;
  keyType?: 'PRI' | 'FK' | 'MUL' | null;
};

type AnalyticsSchemaData = Record<string, AnalyticsSchemaColumn[]>;

const analyticsService = {
  executeQuery: async (
    sql: string,
    options: QueryOptions = {},
    requestConfig: AxiosRequestConfig = {}
  ): Promise<any> => {
    const response = await apiClient.post(
      '/workunitAnalytics/query',
      {
        sql,
        options,
      },
      requestConfig
    );
    return response.data;
  },

  executeScopedQuery: async (
    sql: string,
    options: ScopedQueryOptions,
    requestConfig: AxiosRequestConfig = {}
  ): Promise<any> => {
    const response = await apiClient.post(
      '/workunitAnalytics/scoped/query',
      {
        sql,
        options,
      },
      requestConfig
    );
    return response.data;
  },

  getSchema: async (): Promise<AnalyticsSchemaData> => {
    const response = await apiClient.get('/workunitAnalytics/schema');
    return response.data;
  },

  getScopedSchema: async (): Promise<AnalyticsSchemaData> => {
    const response = await apiClient.get('/workunitAnalytics/scoped/schema');
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

  getDatabaseStats: async (): Promise<any> => {
    const response = await apiClient.get('/workunitAnalytics/stats');
    return response.data;
  },
};

export { analyticsService };
