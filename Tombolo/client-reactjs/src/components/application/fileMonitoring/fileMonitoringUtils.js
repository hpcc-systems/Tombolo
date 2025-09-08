import { authHeader } from '../../common/AuthHeader';

export const evaluateFileMonitoring = async (formData) => {
  const response = await fetch(`/api/fileMonitoring/evaluate`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(formData),
  });
  if (!response.ok) throw new Error('Error saving your response');
  return await response.json();
};

export const getAllFileMonitoring = async ({ applicationId }) => {
  const response = await fetch(`/api/fileMonitoring/all/${applicationId}`, {
    headers: authHeader(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch file monitorings');
  }
  return await response.json();
};

export const createFileMonitoring = async ({ inputData }) => {
  const response = await fetch('/api/fileMonitoring', {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(inputData),
  });
  if (!response.ok) {
    throw new Error('Failed to create file monitoring');
  }
  return await response.json();
};

export const updateSelectedFileMonitoring = async (updatedData, id) => {
  const response = await fetch(`/api/fileMonitoring/${id}`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(updatedData),
  });
  if (!response.ok) {
    throw new Error('Failed to update file monitoring');
  }
  return await response.json();
};

export const handleDeleteFileMonitoring = async (ids) => {
  const response = await fetch(`/api/fileMonitoring`, {
    method: 'DELETE',
    headers: authHeader(),
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new Error('Failed to delete file monitoring');
  }
  return await response.json();
};

export const toggleFileMonitoringStatus = async ({ ids, action }) => {
  const response = await fetch(`/api/fileMonitoring/toggle`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ ids, isActive: action === 'start' }),
  });

  if (!response.ok) {
    throw new Error('Failed to toggle file monitoring status');
  }
  const json = await response.json();
  return json.data;
};

export const handleBulkUpdateFileMonitoring = async ({ updatedData }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ updatedData }),
  };

  const response = await fetch(`/api/fileMonitoring/bulk`, payload);

  if (!response.ok) {
    throw new Error('Failed to bulk update file monitorings');
  }

  return await response.json();
};
