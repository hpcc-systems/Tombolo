import { apiClient } from '@/services/api';

const integrationsService = {
  getAll: async () => {
    const response = await apiClient.get('/integrations/all');
    return response.data;
  },

  getAllActive: async () => {
    const response = await apiClient.get('/integrations/getAllActive');
    return response.data;
  },

  getDetailsByRelationId: async ({ relationId }) => {
    const response = await apiClient.get(`/integrations/integrationDetails/${relationId}`);
    const responseRawData = response.data;

    // Flatten the object (maintaining existing behavior)
    const data = { ...responseRawData, ...responseRawData.integration };
    delete data.integration;

    return data;
  },

  toggle: async ({ integrationId, application_id, active }) => {
    const response = await apiClient.post('/integrations/toggleStatus', {
      integrationId,
      application_id,
      active,
    });
    return response.data;
  },

  updateSettings: async ({ integrationMappingId, integrationSettings }) => {
    const response = await apiClient.put(
      `/integrations/updateIntegrationSettings/${integrationMappingId}`,
      integrationSettings
    );
    return response.data;
  },
};

export default integrationsService;
