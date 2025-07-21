// Local Imports
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

  //sort domains by name
  data.sort((a, b) => a.name.localeCompare(b.name));

  return data;
};

// Update domain and the associated relation to monitoring types
export const updateDomain = async ({ id, payload }) => {
  const payloadOptions = {
    method: 'PATCH',
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

// Get all products
export const getProducts = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch('/api/asr/products', payload);

  if (response.status !== 200) {
    throw new Error('Failed to get products');
  }

  const data = await response.json();

  // Sort products by name
  data.sort((a, b) => a.name.localeCompare(b.name));

  return data;
};

// Create new product
export const createNewProduct = async ({ payload }) => {
  const payloadOptions = {
    method: 'POST',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  const response = await fetch('/api/asr/products', payloadOptions);

  if (response.status !== 200) {
    throw new Error('Failed to add product');
  }

  const data = await response.json();

  return data;
};

// Update product
export const updateProduct = async ({ id, payload }) => {
  const payloadOptions = {
    method: 'PUT',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  const response = await fetch(`/api/asr/products/${id}`, payloadOptions);

  if (response.status !== 200) {
    throw new Error('Failed to update product');
  }

  const data = await response.json();

  return data;
};

// Delete products
export const deleteProduct = async ({ id }) => {
  const payload = {
    method: 'DELETE',
    headers: authHeader(),
  };
  const response = await fetch(`/api/asr/products/${id}`, payload);

  if (response.status !== 200) {
    throw new Error('Failed to delete product');
  }

  const data = await response.json();

  return data;
};

// Get all teams channels
export const getTeamsChannels = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch('/api/teamsHook/', payload);

  if (response.status !== 200) {
    throw new Error('Failed to get teams channels');
  }

  const data = await response.json();

  return data;
};
