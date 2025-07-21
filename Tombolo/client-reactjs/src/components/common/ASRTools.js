import { authHeader } from './AuthHeader.js';

// Get domains for job monitoring - ASR
export const getDomains = async ({ monitoringTypeId }) => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/asr/domainsForSpecificMonitoring/${monitoringTypeId}`, options);
  if (!response.ok) {
    throw new Error('Failed to get domains');
  }
  const domains = await response.json();

  //sort domains by name
  domains.sort((a, b) => a.name.localeCompare(b.name));

  return domains;
};

//Get product categories for selected domain and activity type
export const getProductCategories = async ({ domainId }) => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/asr/productCategoriesForSpecificDomain/${domainId}`, options);
  if (!response.ok) {
    throw new Error('Failed to get product categories');
  }
  const productCategories = await response.json();

  //sort product categories by name
  productCategories.sort((a, b) => a.name.localeCompare(b.name));

  return productCategories;
};
// Get all product categories regardless of selected domain
export const getAllProductCategories = async () => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/asr/productsOnly`, options);

  if (!response.ok) {
    throw new Error('Failed to get product categories');
  }
  const productCategories = await response.json();

  //sort product categories by name
  productCategories.sort((a, b) => a.name.localeCompare(b.name));

  return productCategories;
};

// Get id for particular monitoring type example "Job Monitoring"
export const getMonitoringTypeId = async ({ monitoringTypeName }) => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/monitorings/getMonitoringTypeId/${monitoringTypeName}`, options);
  if (!response.ok) {
    throw new Error('Failed to get monitoring type Id');
  }
  const monitoringTypeId = await response.json();
  return monitoringTypeId;
};
