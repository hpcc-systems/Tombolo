import { apiClient } from '@/services/api';

const breeService = {
  getAll: async (): Promise<any> => {
    const response = await apiClient.get('/bree/all');
    return response.data;
  },

  startJob: async ({ name }: { name: string }): Promise<any> => {
    const response = await apiClient.put('/bree/start_job', { name });
    return response.data;
  },

  stopJob: async ({ name }: { name: string }): Promise<any> => {
    const response = await apiClient.put('/bree/stop_job', { name });
    return response.data;
  },

  removeJob: async ({ name }: { name: string }): Promise<any> => {
    const response = await apiClient.delete('/bree/remove_job', {
      params: { name },
    });
    return response.data;
  },

  startAll: async (): Promise<any> => {
    const response = await apiClient.put('/bree/start_all');
    return response.data;
  },

  stopAll: async (): Promise<any> => {
    const response = await apiClient.put('/bree/stop_all');
    return response.data;
  },
};

export default breeService;
