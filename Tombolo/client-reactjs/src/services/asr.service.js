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
};
export default asrService;
