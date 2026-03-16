import { apiClient } from '@/services/api';
import type { RoleDTO } from '@tombolo/shared';

const rolesService = {
  getAll: async (): Promise<RoleDTO[]> => {
    const response = await apiClient.get('/roles');
    return response.data;
  },
};

export default rolesService;
