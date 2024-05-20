import { authHeader } from '../../common/AuthHeader.js';
import { message } from 'antd';

// Create a directory monitoring
export const createDirectoryMonitoring = async ({ inputData }) => {
  const payload = {
    method: 'POST',
    header: authHeader(),
    body: JSON.stringify(inputData),
  };

  const response = await fetch(`/api/DirectoryMonitoring`, payload);

  if (!response.ok) {
    return message.error('Failed to save directory monitoring');
  }

  const data = await response.json();
  return data;
};

// Function to get all directory monitorings from the server
export const getAllDirectoryMonitorings = async ({ applicationId }) => {
  const payload = {
    method: 'GET',
    header: authHeader(),
  };

  const response = await fetch(`/api/DirectoryMonitoring/all/${applicationId}`, payload);

  if (!response.ok) {
    throw new Error('Failed to get directory monitorings');
  }

  const data = await response.json();
  return data;
};

//Function that checks if the  directory schedule is correct
export const checkScheduleValidity = ({ intermittentScheduling, completeSchedule, cron, cronMessage }) => {
  // Abandon intermittent schedule if user did not completely add the schedule.Eg if they submit form and schedule was partially entered
  const { frequency, scheduleBy, days, dates, weeks, day, month, date, week } = intermittentScheduling;

  let allSchedule = [...completeSchedule];
  if (frequency === 'daily') {
    allSchedule = [...completeSchedule, intermittentScheduling];
  } else if (frequency === 'weekly' && days?.length > 0) {
    allSchedule = [...completeSchedule, intermittentScheduling];
  } else if (frequency === 'monthly' && scheduleBy === 'dates' && dates?.length > 0) {
    allSchedule = [...completeSchedule, intermittentScheduling];
  } else if (frequency === 'monthly' && scheduleBy === 'weeks-day' && weeks?.length > 0 && day) {
    allSchedule = [...completeSchedule, intermittentScheduling];
  } else if (frequency === 'yearly' && scheduleBy === 'month-date' && month && date) {
    allSchedule = [...completeSchedule, intermittentScheduling];
  } else if (frequency === 'yearly' && scheduleBy === 'week-day-month' && week && day && month) {
    allSchedule = [...completeSchedule, intermittentScheduling];
  } else if (frequency === 'cron' && cron != null && cronMessage?.valid) {
    allSchedule = [...completeSchedule, intermittentScheduling];
  }

  if (allSchedule.length > 0) {
    return { valid: true, schedule: allSchedule };
  } else {
    return { valid: false, schedule: [] };
  }
};

//Get all teams hook
export const getAllTeamsHook = async () => {
  const payload = {
    method: 'GET',
    header: authHeader(),
  };

  const response = await fetch(`/api/teamsHook/`, payload);
  if (!response.ok) {
    throw new Error('Failed to get teams hook');
  }

  const data = await response.json();
  return data;
};

// Update a directory monitoring
export const updateSelectedMonitoring = async ({ updatedData }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(updatedData),
  };

  const response = await fetch(`/api/DirectoryMonitoring/`, payload);

  if (!response.ok) {
    return message.error('Failed to update directory monitoring');
  }

  const data = await response.json();
  return data;
};

//Delete directory monitoring
export const handleDeleteDirectoryMonitoring = async ({ id, DirectoryMonitorings, setDirectoryMonitorings }) => {
  try {
    const payload = {
      method: 'DELETE',
      header: authHeader(),
    };

    const response = await fetch(`/api/DirectoryMonitoring/${id}`, payload);

    if (!response.ok) {
      return message.error('Failed to delete directory monitoring');
    }

    // Set directory monitorings
    const filteredDirectoryMonitorings = DirectoryMonitorings.filter((item) => item.id !== id);
    setDirectoryMonitorings(filteredDirectoryMonitorings);
  } catch (err) {
    message.error(err.message);
  }
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

// Get domains for directory monitoring - ASR
export const getDomains = async ({ monitoringTypeId }) => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/asr/domainsForSpecificMonitoring/${monitoringTypeId}`, options);
  if (!response.ok) {
    throw new Error('Failed to get domains');
  }
  const domains = await response.json();

  return domains;
};

//Get product categories for selected domain and activity type
export const getProductCategories = async ({ domainId }) => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/asr/productCategoriesForSpecificDomain/${domainId}`, options);
  if (!response.ok) {
    throw new Error('Failed to get product categories');
  }
  const productCategories = await response.json();
  return productCategories;
};

// Get id for particular monitoring type example "directory Monitoring"
export const getMonitoringTypeId = async ({ monitoringTypeName }) => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/monitorings/getMonitoringTypeId/${monitoringTypeName}`, options);
  if (!response.ok) {
    throw new Error('Failed to get monitoring type Id');
  }
  const monitoringTypeId = await response.json();
  return monitoringTypeId;
};

//Toggle directory monitoring status, just post the id of the directory monitoring to  /toggle in the req body
export const toggleDirectoryMonitoringStatus = async ({ id }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ id }),
  };

  const response = await fetch(`/api/DirectoryMonitoring/toggleIsActive`, payload);
  if (!response.ok) {
    throw new Error('Failed to toggle directory monitoring status');
  }

  const data = await response.json();
  return data;
};

// Bulk delete directory monitorings
export const handleBulkDeleteDirectoryMonitorings = async ({ selectedDirectoryMonitorings }) => {
  const payload = {
    method: 'DELETE',
    headers: authHeader(),
    body: JSON.stringify({ ids: selectedDirectoryMonitorings }),
  };

  const response = await fetch(`/api/DirectoryMonitoring/bulkDelete`, payload);

  if (!response.ok) {
    throw new Error('Failed to bulk delete directory monitorings');
  }
  const data = await response.json();
  return data;
};

// Bulk update
export const handleBulkUpdateDirectoryMonitorings = async ({ updatedData }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ metaData: updatedData }),
  };

  const response = await fetch(`/api/DirectoryMonitoring/bulkUpdate`, payload);

  if (!response.ok) {
    throw new Error('Failed to bulk update directory monitorings');
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
