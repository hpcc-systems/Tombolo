import { authHeader } from '../../../common/AuthHeader.js';

// Function to get all sent notifications
export const getAllSentNotifications = async ({ applicationId }) => {
  const payload = {
    method: 'GET',
    header: authHeader(),
  };

  const response = await fetch(`/api/sent_notifications/${applicationId}`, payload);

  if (!response.ok) {
    throw new Error('Failed to fetch sent notifications');
  }

  const data = await response.json();
  return data;
};

// Function to delete a single notification
export const deleteNotification = async (id) => {
  const payload = {
    method: 'DELETE',
    header: authHeader(),
  };

  const response = await fetch(`/api/sent_notifications/${id}`, payload);

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }

  return true;
};

// Function to delete multiple notifications - send ids as array in req.body
export const deleteMultipleNotifications = async (ids) => {
  const payload = {
    method: 'DELETE',
    header: authHeader(),
    body: JSON.stringify({ ids }),
  };

  const response = await fetch(`/api/sent_notifications`, payload);

  if (!response.ok) {
    throw new Error('Failed to delete notifications');
  }

  return true;
};

// Function to create a new notification
export const createNotification = async ({ notificationPayload }) => {
  const payload = {
    method: 'POST',
    header: authHeader(),
    body: JSON.stringify(notificationPayload),
  };

  const response = await fetch(`/api/sent_notifications`, payload);

  if (!response.ok) {
    throw new Error('Failed to create notification');
  }
  const data = await response.json();
  return data;
};

//Function to update multiple notifications - send ids as array in req.body
export const updateMultipleNotifications = async ({ data }) => {
  const payload = {
    method: 'PATCH',
    header: authHeader(),
    body: JSON.stringify(data),
  };

  const response = await fetch(`/api/sent_notifications`, payload);

  if (!response.ok) {
    throw new Error('Failed to update notifications');
  }
  const responseData = await response.json();
  return responseData;
};

// Statuses for the notification
export const statuses = [
  'Investigating',
  'Re-opened',
  'Triage',
  'Pending Review',
  'On hold',
  'Resolved',
  'Non-actionable',
  'Non-issue',
];
//Get monitoring ID - aka activity type if
export const monitoringTypeId = async ({ monitoringName }) => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/getMonitoringTypeId/${monitoringName}`, payload);

  if (!response.ok) {
    throw new Error('Failed to fetch monitoring type');
  }

  const data = await response.json();
  return data;
};

// Get all domains
export const getAllDomains = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/asr/domainsOnly`, payload);

  if (!response.ok) {
    throw new Error('Failed to fetch domains');
  }

  const data = await response.json();
  return data;
};

// Get all domains for a specific monitoring
export const getDomains = async ({ monitoringId }) => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/asr/domainsForSpecificMonitoring/${monitoringId}`, payload);

  if (!response.ok) {
    throw new Error('Failed to fetch domains');
  }

  const data = await response.json();
  return data;
};

// Get all product categories for a domain
export const getProductCategories = async ({ domainId }) => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/asr/productCategoriesForSpecificDomain/${domainId}`, payload);

  if (!response.ok) {
    throw new Error('Failed to fetch product categories');
  }

  const data = await response.json();
  return data;
};

// Get all product categories regardless of domain
export const getAllProductCategories = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/asr/productsOnly`, payload);

  if (!response.ok) {
    throw new Error('Failed to fetch product categories');
  }

  const data = await response.json();
  return data;
};

// Get all monitorings
export const getAllMonitorings = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/monitorings/`, payload);

  if (!response.ok) {
    throw new Error('Failed to fetch activity types');
  }

  const data = await response.json();
  return data;
};

export const getActivityTypes = async () => {
  return [];
};
