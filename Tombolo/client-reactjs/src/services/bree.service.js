import { apiClient } from '@/services/api';

const breeService = {
  // Get all scheduled jobs
  getAll: async () => {
    const response = await apiClient.get('/bree/all');
    return response.data;
  },

  // Start a specific job
  startJob: async ({ name }) => {
    const response = await apiClient.put('/bree/start_job', { name });
    return response.data;
  },

  // Stop a specific job
  stopJob: async ({ name }) => {
    const response = await apiClient.put('/bree/stop_job', { name });
    return response.data;
  },

  // Remove a job from scheduler
  removeJob: async ({ name }) => {
    const response = await apiClient.delete('/bree/remove_job', {
      params: { name },
    });
    return response.data;
  },

  // Start all jobs
  startAll: async () => {
    const response = await apiClient.put('/bree/start_all');
    return response.data;
  },

  // Stop all jobs
  stopAll: async () => {
    const response = await apiClient.put('/bree/stop_all');
    return response.data;
  },
};

export default breeService;
