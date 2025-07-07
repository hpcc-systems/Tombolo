import { authHeader } from '../../common/AuthHeader';

export const getAllCostMonitorings = async () => {
  const response = await fetch('/api/costMonitoring', {
    headers: authHeader(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch cost monitorings');
  }
  return await response.json();
};

export const createCostMonitoring = async ({ inputData }) => {
  const response = await fetch('/api/costMonitoring', {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(inputData),
  });
  if (!response.ok) {
    throw new Error('Failed to create cost monitoring');
  }
  return await response.json();
};

export const updateSelectedCostMonitoring = async ({ updatedData: costMonitoringData }) => {
  const response = await fetch(`/api/costMonitoring/`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(costMonitoringData),
  });
  if (!response.ok) {
    throw new Error('Failed to update cost monitoring');
  }
  return await response.json();
};

export const handleDeleteCostMonitoring = async ({ id, costMonitorings, setCostMonitorings }) => {
  const response = await fetch(`/api/costMonitoring/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete cost monitoring');
  }
  const filteredCostMonitorings = costMonitorings.filter((item) => item.id !== id);
  setCostMonitorings(filteredCostMonitorings);
};

export const toggleCostMonitoringStatus = async (ids, action) => {
  const response = await fetch(`/api/costMonitoring/toggle`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify({ ids, action }),
  });
  if (!response.ok) {
    throw new Error('Failed to toggle cost monitoring status');
  }
  const json = await response.json();
  return json.updatedCostMonitorings;
};

export const handleBulkDeleteCostMonitorings = async (ids) => {
  const response = await fetch('/api/costMonitoring/bulk', {
    method: 'DELETE',
    headers: authHeader(),
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new Error('Failed to bulk delete cost monitorings');
  }
  return await response.json();
};

export const handleBulkUpdateCostMonitorings = async ({ updatedData }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ costMonitorings: updatedData }),
  };

  const response = await fetch(`/api/costMonitoring/bulk`, payload);

  if (!response.ok) {
    throw new Error('Failed to bulk update cost monitorings');
  }

  return await response.json();
};
