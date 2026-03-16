import { apiClient } from '@/services/api';
import type { ApplicationDTO } from '@tombolo/shared';

const applicationsService = {
  getAll: async (): Promise<ApplicationDTO[]> => {
    const response = await apiClient.get('/app/read/app_list');
    return response.data;
  },

  save: async (applicationData: any): Promise<ApplicationDTO> => {
    const response = await apiClient.post('/app/read/saveApplication', applicationData);
    return response.data;
  },

  delete: async ({ appIdToDelete, userId }: { appIdToDelete: string; userId: string }): Promise<any> => {
    const response = await apiClient.post('/app/read/deleteApplication', {
      appIdToDelete,
      user: userId,
    });
    return response.data;
  },
};

export default applicationsService;
