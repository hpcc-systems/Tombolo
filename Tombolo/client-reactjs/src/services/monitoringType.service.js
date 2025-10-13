import { apiClient } from '@/services/api';

const monitoringTypeService = {
  getId: async ({ monitoringTypeName }) => {
    const response = await apiClient.get(`/monitorings/getMonitoringTypeId/${monitoringTypeName}`);
    return response.data;
  },
};
export default monitoringTypeService;
