// This file contains all the api calls related to the FIDO module
import { authHeader } from '../components/common/AuthHeader';

//Get all activities
export const getActivityTypes = async ({ domainId }) => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/fido/activityTypes/${domainId}`, options);
  if (!response.ok) {
    throw new Error('Failed to get activities');
  }
  const activities = await response.json();
  return activities;
};

// Get all domains
export const getAllDomains = async () => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/fido/allDomains/`, options);
  if (!response.ok) {
    throw new Error('Failed to get domains');
  }
  const domains = await response.json();
  return domains;
};

// Get only the domains that are related to specific  activity type
export const getDomains = async ({ activityTypeId }) => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/fido/domains/${activityTypeId}`, options);
  if (!response.ok) {
    throw new Error('Failed to get domains');
  }
  const domains = await response.json();
  return domains;
};

//Get product categories for selected domain and activity type
export const getProductCategories = async ({ domainId, activityTypeId }) => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/fido/productCategories/${domainId}/${activityTypeId}`, options);
  if (!response.ok) {
    throw new Error('Failed to get product categories');
  }
  const productCategories = await response.json();
  return productCategories;
};
