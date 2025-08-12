import { authHeader } from '../../common/AuthHeader';

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

// Update existing cluster monitoring
export const updateClusterMonitoring = async (data) => {
  const payload = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(`/api/clusterMonitoring`, payload);

  if (!response.ok) {
    throw new Error('Failed to update cluster monitoring');
  }
  return await response.json();
};

// Approve or Reject cluster monitoring
export const evaluateClusterMonitoring = async (data) => {
  const payload = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(`/api/clusterMonitoring/evaluate`, payload);

  if (!response.ok) {
    throw new Error('Failed to evaluate cluster monitoring');
  }
  return await response.json();
};

// Toggle cluster monitoring is active status
export const toggleClusterMonitoringActiveStatus = async (id) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ id }),
  };

  const response = await fetch(`/api/clusterMonitoring/toggle`, payload);

  if (!response.ok) {
    throw new Error('Failed to toggle cluster monitoring status');
  }
  return await response.json();
};

// Delete cluster monitoring
export const deleteClusterMonitoring = async (id) => {
  const payload = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ ids: [id] }),
  };

  const response = await fetch(`/api/clusterMonitoring`, payload);

  if (!response.ok) {
    throw new Error('Failed to delete cluster monitoring');
  }
  return await response.json();
};

// Find a unique name for the monitoring
export const findUniqueName = (name, clusterMonitoring) => {
  let i = 1;
  let newName = name + ' ( ' + i + ' )';
  while (clusterMonitoring.find((monitoring) => monitoring.monitoringName === newName)) {
    i++;
    newName = name + ' ( ' + i + ' )';
  }

  return newName;
};

// Identify erroneous tab(s)
const formFields = {
  0: ['monitoringName', 'description', 'clusterMonitoringType', 'clusterId', 'jobName'],
  1: ['primaryContacts'],
};

export const identifyErroneousTabs = ({ erroneousFields }) => {
  const erroneousTabs = [];
  const tab0ErroneousFields = erroneousFields.filter((item) => formFields[0].includes(item));
  const tab1ErroneousFields = erroneousFields.filter((item) => formFields[1].includes(item));

  if (tab0ErroneousFields.length > 0) erroneousTabs.push((0).toString());
  if (tab1ErroneousFields.length > 0) erroneousTabs.push((1).toString());

  return erroneousTabs;
};
