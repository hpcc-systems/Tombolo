import { authHeader } from '../../common/AuthHeader';

// Get all cluster monitoring data
export const getAllClusterMonitoring = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/clusterMonitoring`, payload);

  if (!response.ok) {
    throw new Error('Failed to fetch cost monitoring data');
  }
  return await response.json();
};

// Create a new cluster monitoring
export const createClusterMonitoring = async (data) => {
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(`/api/clusterMonitoring`, payload);

  if (!response.ok) {
    throw new Error('Failed to create cluster monitoring');
  }
  return await response.json();
};
