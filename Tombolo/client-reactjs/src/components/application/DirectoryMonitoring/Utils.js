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
export const updateMonitoring = async ({ updatedData }) => {
  const payload = {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(updatedData),
  };

  const { id } = updatedData;

  const response = await fetch(`/api/DirectoryMonitoring/update/${id}`, payload);

  if (!response.ok) {
    return message.error('Failed to update directory monitoring');
  }

  const data = await response.json();
  return data;
};

// Update a directory monitoring
export const approveSelectedMonitoring = async ({ updatedData }) => {
  const payload = {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(updatedData),
  };

  const { id } = updatedData;

  const response = await fetch(`/api/DirectoryMonitoring/approve/${id}`, payload);

  if (!response.ok) {
    return message.error('Failed to update directory monitoring');
  }

  const data = await response.json();
  return data;
};

//Delete directory monitoring
export const handleDeleteDirectoryMonitoring = async ({ id, directoryMonitorings, setDirectoryMonitorings }) => {
  try {
    const payload = {
      method: 'DELETE',
      header: authHeader(),
    };

    const response = await fetch(`/api/DirectoryMonitoring/delete/${id}`, payload);

    if (!response.status === 204) {
      return message.error('Failed to delete directory monitoring');
    }

    // Set directory monitorings
    const filteredDirectoryMonitorings = directoryMonitorings.filter((item) => item.id !== id);
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

//Toggle directory monitoring status, just post the id of the directory monitoring to  /toggle in the req body
export const toggleDirectoryMonitoringStatus = async ({ id }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ id }),
  };

  const response = await fetch(`/api/DirectoryMonitoring/${id}/active`, payload);

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
  return true;
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