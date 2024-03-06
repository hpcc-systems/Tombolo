import { authHeader } from '../../common/AuthHeader.js';

// Get all integrations
export const getAllIntegrations = async () => {
  const payload = {
    method: 'GET',
    header: authHeader(),
  };
  const response = await fetch('/api/integrations/all', payload);

  if (response.status !== 200) {
    throw new Error('Failed to get integrations');
  }

  const data = await response.json();

  return data;
};

// Get Integration By Name
export const getIntegrationByName = async (name) => {
  const payload = {
    method: 'GET',
    header: authHeader(),
  };
  const response = await fetch(`/api/integrations/byName/${name}`, payload);

  if (response.status !== 200) {
    throw new Error('Failed to get integration');
  }

  const data = await response.json();

  return data;
};

// Activate or deactivate integration
export const toggleIntegration = async ({ integrationId, active }) => {
  const payload = {
    method: 'PATCH',
    header: authHeader(),
    body: JSON.stringify({ active }),
  };
  const response = await fetch(`/api/integrations/${integrationId}`, payload);

  if (response.status !== 200) {
    throw new Error('Failed to toggle integration');
  }

  const data = await response.json();

  return data;
};
