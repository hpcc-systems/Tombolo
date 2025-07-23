import { authHeader } from '../../common/AuthHeader.js';

// Create a directory monitoring
export const createLandingZoneMonitoring = async ({ inputData }) => {
  const payload = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(inputData),
  };

  const response = await fetch(`/api/landingZoneMonitoring`, payload);

  if (!response.ok) {
    throw new Error('Failed to save directory monitoring');
  }

  const { data } = await response.json();
  return data;
};

// Function to get all LZ monitorings from the server
export const getAllLzMonitorings = async ({ applicationId }) => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/landingZoneMonitoring/all/${applicationId}`, payload);

  if (!response.ok) {
    throw new Error('Failed to get landing zone monitorings');
  }

  const { data } = await response.json();
  return data;
};

// Update a directory monitoring
export const updateMonitoring = async ({ updatedData }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(updatedData),
  };

  const response = await fetch(`/api/landingZoneMonitoring`, payload);

  if (!response.ok) {
    throw new Error('Failed to update directory monitoring');
  }

  const data = await response.json();
  return data;
};

// Update a directory monitoring
export const approveSelectedMonitoring = async (formData) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(formData),
  };

  const response = await fetch(`/api/landingZoneMonitoring/evaluate`, payload);

  if (!response.ok) {
    throw new Error('Failed to update directory monitoring');
  }

  const data = await response.json();
  return data;
};

//Delete landing zone monitoring
export const deleteLzMonitoring = async ({ id }) => {
  const payload = {
    method: 'DELETE',
    headers: authHeader(),
  };

  const response = await fetch(`/api/landingZoneMonitoring/${id}`, payload);

  if (!response.ok) {
    throw new Error(`Failed to delete landing zone monitoring: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

// Function to identify erroneous tab(s)
const formFields = {
  0: ['monitoringName', 'description', 'monitoringScope', 'clusterId', 'directoryName'],
  1: ['domain', 'productCategory', 'expectedStartTime', 'expectedCompletionTime', 'severity', 'requireComplete'],
  2: ['notificationCondition', 'teamsHooks', 'primaryContacts', 'secondaryContacts', 'notifyContacts'],
};

export const identifyErroneousTabs = ({ erroneousFields }) => {
  const erroneousTabs = [];
  const tab0ErroneousFields = erroneousFields.filter((item) => formFields[0].includes(item));
  const tab1ErroneousFields = erroneousFields.filter((item) => formFields[1].includes(item));
  const tab2ErroneousFields = erroneousFields.filter((item) => formFields[2].includes(item));

  if (tab0ErroneousFields.length > 0) erroneousTabs.push((0).toString());
  if (tab1ErroneousFields.length > 0) erroneousTabs.push((1).toString());
  if (tab2ErroneousFields.length > 0) erroneousTabs.push((2).toString());

  return erroneousTabs;
};

//Toggle landing zone monitoring status, just post the id of the landing zone monitoring to  /toggle in the req body
export const toggleLzMonitoringStatus = async ({ ids, isActive }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ ids, isActive }),
  };

  const response = await fetch(`/api/landingZoneMonitoring/toggleStatus`, payload);

  if (!response.ok) {
    throw new Error('Failed to toggle landing zone monitoring status');
  }

  const data = await response.json();
  return data;
};

// Bulk delete directory monitorings
export const handleLzBulkDelete = async ({ ids }) => {
  const payload = {
    method: 'DELETE',
    headers: authHeader(),
    body: JSON.stringify({ ids }),
  };

  const response = await fetch(`/api/landingZoneMonitoring/bulkDelete`, payload);
  if (!response.ok) {
    throw new Error('Failed to bulk delete landing zone monitorings');
  }
  return true;
};

// Bulk update
export const handleBulkUpdateLzMonitorings = async (updatedData) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ updatedData }),
  };

  const response = await fetch(`/api/LandingZoneMonitoring/bulkUpdate`, payload);

  if (!response.ok) {
    throw new Error('Failed to bulk update landing zone monitorings');
  }

  const data = await response.json();
  return data;
};

export const handleBulkApproveDirectoryMonitorings = async ({ selectedDirectoryMonitorings, formData }) => {
  const { approved, approvedAt, approvedBy, approvalStatus, active } = formData;

  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({
      ids: selectedDirectoryMonitorings,
      approved,
      approvedAt,
      approvedBy,
      approvalStatus,
      active,
    }),
  };

  const response = await fetch(`/api/DirectoryMonitoring/bulkApprove`, payload);

  if (!response.ok) {
    throw new Error('Failed to bulk approve directory monitorings');
  }
  const data = await response.json();
  return data;
};

// Check if 2 schedule are the same
export function isScheduleUpdated({ existingSchedule, newSchedule }) {
  if (existingSchedule.length !== newSchedule.length) return true;
  for (let i = 0; i < existingSchedule.length; i++) {
    if (JSON.stringify(existingSchedule[i]) !== JSON.stringify(newSchedule[i])) return true;
  }
  return false;
}

export const getDropzones = async (selectedCluster) => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/landingZoneMonitoring/getDropzones?clusterId=${selectedCluster.id}`, payload);

  if (!response.ok) {
    throw new Error('Failed to get dropzones');
  }

  const data = await response.json();
  return data;
};

export const getDirectoryList = async ({ clusterId, dropzoneName, netaddr, path, signal }) => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
    signal, // Add abort signal to fetch options
  };

  const queryParams = new URLSearchParams({
    clusterId,
    DropZoneName: dropzoneName,
    Netaddr: netaddr,
    Path: path,
    DirectoryOnly: 'true',
  });

  const response = await fetch(`/api/landingZoneMonitoring/fileList?${queryParams}`, payload);

  if (!response.ok) {
    throw new Error('Failed to get directory list');
  }

  const data = await response.json();
  return data;
};

// Convert storage values to MB for comparison
export const convertToMB = (value, unit) => {
  const multipliers = { MB: 1, GB: 1024, TB: 1024 * 1024, PB: 1024 * 1024 * 1024 };
  return value * (multipliers[unit] || 1);
};
