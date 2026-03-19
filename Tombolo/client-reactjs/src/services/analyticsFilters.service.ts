import { apiClient } from '@/services/api';

export interface AnalyticsFilter {
  id: string;
  name: string;
  conditions: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnalyticsFilterPayload {
  name: string;
  conditions: string;
  description?: string;
}

export interface UpdateAnalyticsFilterPayload {
  name?: string;
  conditions?: string;
  description?: string;
}

const analyticsFiltersService = {
  /**
   * Get all analytics filters for the authenticated user
   */
  getAll: async (): Promise<AnalyticsFilter[]> => {
    const response = await apiClient.get('/analyticsFilters');
    return response.data; // dataExtractorInterceptor already unwraps response.data.data
  },

  /**
   * Get a single analytics filter by ID
   */
  getById: async (id: string): Promise<AnalyticsFilter> => {
    const response = await apiClient.get(`/analyticsFilters/${id}`);
    return response.data; // dataExtractorInterceptor already unwraps response.data.data
  },

  /**
   * Create a new analytics filter
   */
  create: async (payload: CreateAnalyticsFilterPayload): Promise<AnalyticsFilter> => {
    const response = await apiClient.post('/analyticsFilters', payload);
    return response.data; // dataExtractorInterceptor already unwraps response.data.data
  },

  /**
   * Update an analytics filter
   */
  update: async (id: string, payload: UpdateAnalyticsFilterPayload): Promise<AnalyticsFilter> => {
    const response = await apiClient.patch(`/analyticsFilters/${id}`, payload);
    return response.data; // dataExtractorInterceptor already unwraps response.data.data
  },

  /**
   * Delete an analytics filter
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/analyticsFilters/${id}`);
  },
};

export default analyticsFiltersService;
