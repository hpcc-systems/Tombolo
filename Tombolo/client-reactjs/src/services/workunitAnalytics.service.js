import { apiClient } from '@/services/api';

const analyticsService = {
  /**
   * Execute a read-only SQL SELECT query against work_unit_details table
   * This is a general analytics query not scoped to a specific workunit
   * @param {string} sql - SQL query to execute
   * @param {object} options - Query options
   * @param {string} options.clusterId - Optional cluster filter
   * @param {number} options.limit - Max rows to return (default 1000)
   * @returns {Promise<{columns: string[], rows: any[], executionTime: number}>}
   */
  executeQuery: async (sql, options = {}) => {
    const response = await apiClient.post('/workunitAnalytics/query', {
      sql,
      ...options,
    });
    return response.data;
  },

  /**
   * Get schema information for the work_unit_details table
   * @returns {Promise<Array>} Array of column definitions
   */
  getSchema: async () => {
    const response = await apiClient.get('/workunitAnalytics/schema');
    return response.data;
  },

  /**
   * Get saved queries for the current user
   * @returns {Promise<Array>} Array of saved query objects
   */
  getSavedQueries: async () => {
    const response = await apiClient.get('/workunitAnalytics/queries');
    return response.data;
  },

  /**
   * Save a new query
   * @param {object} query - Query object
   * @param {string} query.name - Query name
   * @param {string} query.sql - SQL query
   * @param {string} query.description - Optional description
   * @returns {Promise<Object>} Saved query object
   */
  saveQuery: async query => {
    const response = await apiClient.post('/workunitAnalytics/queries', query);
    return response.data;
  },

  /**
   * Update an existing saved query
   * @param {number} queryId - Query ID
   * @param {object} updates - Fields to update
   * @returns {Promise<Object>} Updated query object
   */
  updateQuery: async (queryId, updates) => {
    const response = await apiClient.put(`/workunitAnalytics/queries/${queryId}`, updates);
    return response.data;
  },

  /**
   * Delete a saved query
   * @param {number} queryId - Query ID
   * @returns {Promise<void>}
   */
  deleteQuery: async queryId => {
    await apiClient.delete(`/workunitAnalytics/queries/${queryId}`);
  },

  /**
   * Export query results to CSV
   * @param {object} results - Query results object
   * @param {string} filename - Optional filename
   * @returns {void} Triggers download
   */
  exportToCSV: (results, filename = 'query-results') => {
    if (!results || !results.rows || results.rows.length === 0) {
      throw new Error('No data to export');
    }

    const headers = results.columns.join(',');
    const rows = results.rows
      .map(row =>
        results.columns
          .map(col => {
            const value = row[col];
            // Handle null/undefined
            if (value === null || value === undefined) return '';
            // Escape quotes and wrap in quotes if contains comma or quotes
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

  /**
   * Export query results to JSON
   * @param {object} results - Query results object
   * @param {string} filename - Optional filename
   * @returns {void} Triggers download
   */
  exportToJSON: (results, filename = 'query-results') => {
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

  /**
   * Get query execution statistics
   * @param {string} sql - SQL query
   * @returns {Promise<Object>} Estimated execution stats
   */
  analyzeQuery: async sql => {
    const response = await apiClient.post('/workunitAnalytics/analyze', { sql });
    return response.data;
  },

  /**
   * Get quick stats about the database
   * @returns {Promise<Object>} Database statistics
   */
  getDatabaseStats: async () => {
    const response = await apiClient.get('/workunitAnalytics/stats');
    return response.data;
  },
};

export { analyticsService };
