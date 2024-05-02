// Local imports
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

// Get Integration By integration to app mapping id
export const getIntegrationDetailsByRelationId = async ({ relationId }) => {
  const payload = {
    method: 'GET',
    header: authHeader(),
  };
  const response = await fetch(`/api/integrations/integrationDetails/${relationId}`, payload);

  if (response.status !== 200) {
    throw new Error('Failed to get integration');
  }

  const responseRawData = await response.json();

  // Flatten the object
  const data = { ...responseRawData, ...responseRawData.integration };
  delete data.integration;

  return data;
};

// Activate or deactivate integration
export const toggleIntegration = async ({ integrationId, application_id, active }) => {
  const payload = {
    method: 'POST',
    header: authHeader(),
    body: JSON.stringify({ integrationId, application_id, active }),
  };
  const response = await fetch(`/api/integrations/toggleStatus`, payload);

  if (response.status !== 200) {
    throw new Error('Failed to toggle integration');
  }

  const data = await response.json();

  return data;
};

// Update integration settings/configuration
export const updateIntegrationSettings = async ({ integrationMappingId, integrationSettings }) => {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(integrationSettings),
  };
  const response = await fetch(`/api/integrations/updateIntegrationSettings/${integrationMappingId}`, requestOptions);

  if (response.status !== 200) {
    throw new Error('Failed to update integration settings');
  }

  const data = await response.json();

  return data;
};
