import { apiClient } from '@/services/api';

const asrService = {
  getDomains: async ({ monitoringTypeId }: { monitoringTypeId: string }): Promise<any[]> => {
    const response = await apiClient.get(`/asr/domainsForSpecificMonitoring/${monitoringTypeId}`);
    const domains = response.data as any[];
    domains.sort((a, b) => a.name.localeCompare(b.name));
    return domains;
  },

  getProductCategories: async ({ domainId }: { domainId: string }): Promise<any[]> => {
    const response = await apiClient.get(`/asr/productCategoriesForSpecificDomain/${domainId}`);
    const productCategories = response.data as any[];
    productCategories.sort((a, b) => a.name.localeCompare(b.name));
    return productCategories;
  },

  getAllProductCategories: async (): Promise<any[]> => {
    const response = await apiClient.get(`/asr/productsOnly`);
    const productCategories = response.data as any[];
    productCategories.sort((a, b) => a.name.localeCompare(b.name));
    return productCategories;
  },

  getAllDomains: async (): Promise<any[]> => {
    const response = await apiClient.get('/asr/domains');
    const data = response.data as any[];
    data.sort((a, b) => a.name.localeCompare(b.name));
    return data;
  },

  createDomain: async ({ payload }: { payload: any }): Promise<any> => {
    const response = await apiClient.post('/asr/domains', payload);
    return response.data;
  },

  updateDomain: async ({ id, payload }: { id: string; payload: any }): Promise<any> => {
    const response = await apiClient.patch(`/asr/domains/${id}`, payload);
    return response.data;
  },

  deleteDomain: async ({ id }: { id: string }): Promise<any> => {
    const response = await apiClient.delete(`/asr/domains/${id}`);
    return response.data;
  },

  getAllProducts: async (): Promise<any[]> => {
    const response = await apiClient.get('/asr/products');
    const data = response.data as any[];
    data.sort((a, b) => a.name.localeCompare(b.name));
    return data;
  },

  createProduct: async ({ payload }: { payload: any }): Promise<any> => {
    const response = await apiClient.post('/asr/products', payload);
    return response.data;
  },

  updateProduct: async ({ id, payload }: { id: string; payload: any }): Promise<any> => {
    const response = await apiClient.put(`/asr/products/${id}`, payload);
    return response.data;
  },

  deleteProduct: async ({ id }: { id: string }): Promise<any> => {
    const response = await apiClient.delete(`/asr/products/${id}`);
    return response.data;
  },

  getTeamsChannels: async (): Promise<any> => {
    const response = await apiClient.get('/teamsHook/');
    return response.data;
  },
};

export default asrService;
