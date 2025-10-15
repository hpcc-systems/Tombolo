import { apiClient } from '@/services/api';

const asrService = {
  getDomains: async ({ monitoringTypeId }) => {
    const response = await apiClient.get(`/asr/domainsForSpecificMonitoring/${monitoringTypeId}`);
    const domains = response.data;
    //sort domains by name
    domains.sort((a, b) => a.name.localeCompare(b.name));
    return domains;
  },

  getProductCategories: async ({ domainId }) => {
    const response = await apiClient.get(`/asr/productCategoriesForSpecificDomain/${domainId}`);
    const productCategories = response.data;
    //sort product categories by name
    productCategories.sort((a, b) => a.name.localeCompare(b.name));
    return productCategories;
  },

  getAllProductCategories: async () => {
    const response = await apiClient.get(`/asr/productsOnly`);
    const productCategories = response.data;
    //sort product categories by name
    productCategories.sort((a, b) => a.name.localeCompare(b.name));
    return productCategories;
  },

  // Domain management
  getAllDomains: async () => {
    const response = await apiClient.get('/asr/domains');
    const data = response.data;
    //sort domains by name
    data.sort((a, b) => a.name.localeCompare(b.name));
    return data;
  },

  createDomain: async ({ payload }) => {
    const response = await apiClient.post('/asr/domains', payload);
    return response.data;
  },

  updateDomain: async ({ id, payload }) => {
    const response = await apiClient.patch(`/asr/domains/${id}`, payload);
    return response.data;
  },

  deleteDomain: async ({ id }) => {
    const response = await apiClient.delete(`/asr/domains/${id}`);
    return response.data;
  },

  // Product management
  getAllProducts: async () => {
    const response = await apiClient.get('/asr/products');
    const data = response.data;
    // Sort products by name
    data.sort((a, b) => a.name.localeCompare(b.name));
    return data;
  },

  createProduct: async ({ payload }) => {
    const response = await apiClient.post('/asr/products', payload);
    return response.data;
  },

  updateProduct: async ({ id, payload }) => {
    const response = await apiClient.put(`/asr/products/${id}`, payload);
    return response.data;
  },

  deleteProduct: async ({ id }) => {
    const response = await apiClient.delete(`/asr/products/${id}`);
    return response.data;
  },

  // Teams channels
  getTeamsChannels: async () => {
    const response = await apiClient.get('/teamsHook/');
    return response.data;
  },
};

export default asrService;
