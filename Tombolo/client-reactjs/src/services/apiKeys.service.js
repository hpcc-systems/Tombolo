import { apiClient } from '@/services/api';

const apiKeysService = {
  getAll: async ({ applicationId }) => {
    const response = await apiClient.get(`/key/all/${applicationId}`);
    return response.data;
  },

  create: async ({ applicationId, formData }) => {
    const response = await apiClient.post(`/key/newKey/${applicationId}`, { applicationId, formData });
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/key/${id}`);
    return response.data;
  },
};

export default apiKeysService;
