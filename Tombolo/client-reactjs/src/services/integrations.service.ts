import { apiClient } from '@/services/api';

const integrationsService = {
  getAll: async (): Promise<any[]> => {
    const response = await apiClient.get('/integrations/all');
    return response.data;
  },

  getAllActive: async (): Promise<any[]> => {
    const response = await apiClient.get('/integrations/getAllActive');
    return response.data;
  },

  getDetailsByRelationId: async ({ relationId }: { relationId: string }): Promise<any> => {
    const response = await apiClient.get(`/integrations/integrationDetails/${relationId}`);
    const responseRawData = response.data;

    const data = { ...responseRawData, ...responseRawData.integration };
    delete data.integration;

    return data;
  },

  toggle: async ({
    integrationId,
    application_id,
    active,
  }: {
    integrationId: string;
    application_id?: string;
    active: boolean;
  }): Promise<any> => {
    const response = await apiClient.post('/integrations/toggleStatus', {
      integrationId,
      application_id,
      active,
    });
    return response.data;
  },

  updateSettings: async ({
    integrationMappingId,
    integrationSettings,
  }: {
    integrationMappingId: string;
    integrationSettings: any;
  }): Promise<any> => {
    const response = await apiClient.put(
      `/integrations/updateIntegrationSettings/${integrationMappingId}`,
      integrationSettings
    );
    return response.data;
  },
};

export default integrationsService;
