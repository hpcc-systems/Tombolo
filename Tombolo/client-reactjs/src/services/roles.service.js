import { apiClient } from '@/services/api';

const rolesService = {
  // Get all available roles
  getAll: async () => {
    const response = await apiClient.get('/roles');
    return response.data;
  },
};

export default rolesService;
