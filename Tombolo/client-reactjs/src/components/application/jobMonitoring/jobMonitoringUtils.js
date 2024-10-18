import { authHeader } from '../../common/AuthHeader.js';
import { message } from 'antd';

// Create a job monitoring
export const createJobMonitoring = async ({ inputData }) => {
  const payload = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(inputData),
  };

  const response = await fetch(`/api/jobmonitoring`, payload);

  if (!response.ok) {
    throw new Error('Failed to save job monitoring');
  }

  const data = await response.json();
  return data;
};

// Function to get all job monitorings from the server
export const getAllJobMonitorings = async ({ applicationId }) => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/jobmonitoring/all/${applicationId}`, payload);

  if (!response.ok) {
    throw new Error('Failed to get job monitorings');
  }

  const data = await response.json();
  return data;
};

//Function that checks if the  job schedule is correct
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

// Update a job monitoring
export const updateSelectedMonitoring = async ({ updatedData }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(updatedData),
  };

  const response = await fetch(`/api/jobmonitoring/`, payload);

  if (!response.ok) {
    throw new Error('Failed to update job monitoring');
  }

  const data = await response.json();
  return data;
};

//Delete job monitoring
export const handleDeleteJobMonitoring = async ({ id, jobMonitorings, setJobMonitorings }) => {
  try {
    const payload = {
      method: 'DELETE',
      headers: authHeader(),
    };

    const response = await fetch(`/api/jobmonitoring/${id}`, payload);

    if (!response.ok) {
      throw new Error('Failed to delete job monitoring');
    }

    // Set job monitorings
    const filteredJobMonitorings = jobMonitorings.filter((item) => item.id !== id);
    setJobMonitorings(filteredJobMonitorings);
    message.success('Job monitoring deleted successfully');
  } catch (err) {
    throw new Error(err.message);
  }
};

// Function to identify erroneous tab(s)
const formFields = {
  0: ['monitoringName', 'description', 'monitoringScope', 'clusterId', 'jobName'],
  1: ['domain', 'productCategory', 'expectedStartTime', 'expectedCompletionTime', 'severity', 'requireComplete'],
  2: ['notificationCondition', 'primaryContacts', 'secondaryContacts', 'notifyContacts'],
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

//Toggle job monitoring status, just post the id of the job monitoring to  /toggle in the req body
export const toggleJobMonitoringStatus = async ({ id }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ id }),
  };

  const response = await fetch(`/api/jobmonitoring/toggleIsActive`, payload);
  if (!response.ok) {
    throw new Error('Failed to toggle job monitoring status');
  }

  const data = await response.json();
  return data;
};

// Bulk delete job monitorings
export const handleBulkDeleteJobMonitorings = async ({ selectedJobMonitorings }) => {
  const payload = {
    method: 'DELETE',
    headers: authHeader(),
    body: JSON.stringify({ ids: selectedJobMonitorings }),
  };

  const response = await fetch(`/api/jobmonitoring/bulkDelete`, payload);

  if (!response.ok) {
    throw new Error('Failed to bulk delete job monitorings');
  }
  const data = await response.json();
  return data;
};

// Bulk update
export const handleBulkUpdateJobMonitorings = async ({ updatedData }) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ metaData: updatedData }),
  };

  const response = await fetch(`/api/jobmonitoring/bulkUpdate`, payload);

  if (!response.ok) {
    throw new Error('Failed to bulk update job monitorings');
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

// Check if new name job monitoring name already exists
export function doesNameExist({ jobMonitorings, newName }) {
  return jobMonitorings.some((job) => job.monitoringName === newName);
}
