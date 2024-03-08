// Local Imorts
import { authHeader } from '../../../common/AuthHeader.js';

// Get all monitorings
export const getMonitoringTypes = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch('/api/monitorings', payload);

  if (response.status !== 200) {
    throw new Error('Failed to get monitorings');
  }

  const data = await response.json();

  return data;
};

// Add new domain
export const createNewDomain = async ({ payload }) => {
  console.log(payload);
  const payloadOptions = {
    method: 'POST',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  const response = await fetch('/api/asr/domains', payloadOptions);

  if (response.status !== 200) {
    throw new Error('Failed to add domain');
  }

  const data = await response.json();

  return data;
};

// Get all domains and the associated monitoring types
export const getDomains = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch('/api/asr/domains', payload);

  if (response.status !== 200) {
    throw new Error('Failed to get domains');
  }

  const data = await response.json();

  return data;
};

// Update domain and the associated relation to monitoring types
export const updateDomain = async ({ id, payload }) => {
  const payloadOptions = {
    method: 'PUT',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  const response = await fetch(`/api/asr/domains/${id}`, payloadOptions);

  if (response.status !== 200) {
    throw new Error('Failed to update domain');
  }

  const data = await response.json();

  return data;
};

// Delete domain
export const deleteDomain = async ({ id }) => {
  const payload = {
    method: 'DELETE',
    headers: authHeader(),
  };
  const response = await fetch(`/api/asr/domains/${id}`, payload);

  if (response.status !== 200) {
    throw new Error('Failed to delete domain');
  }

  const data = await response.json();

  return data;
};
