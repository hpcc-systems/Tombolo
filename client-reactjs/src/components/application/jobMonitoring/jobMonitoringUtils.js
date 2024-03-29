import { authHeader } from '../../common/AuthHeader.js';
import { message } from 'antd';

// Function to get all job monitorings from the server
export const getAllJobMonitorings = async ({ applicationId }) => {
  const payload = {
    method: 'GET',
    header: authHeader(),
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

//Delete job monitoring
export const handleDeleteJobMonitoring = async ({ id, jobMonitorings, setJobMonitorings }) => {
  try {
    const payload = {
      method: 'DELETE',
      header: authHeader(),
    };

    const response = await fetch(`/api/jobmonitoring/${id}`, payload);

    if (!response.ok) {
      return message.error('Failed to delete job monitoring');
    }

    // Set job monitorings
    const filteredJobMonitorings = jobMonitorings.filter((item) => item.id !== id);
    setJobMonitorings(filteredJobMonitorings);
  } catch (err) {
    message.error(err.message);
  }
};

// Function to identify erroneous tab(s)
const formFields = {
  0: ['monitoringName', 'description', 'monitoringScope', 'clusterId', 'jobName'],
  1: ['domain', 'productCategory', 'jobMonitorType', 'severity', 'requireComplete', 'threshold', 'isActive'],
  2: ['notificationCondition', 'teamsHooks', 'primaryContacts', 'secondaryContacts', 'notifyContacts'],
};

export const identifyErroneousTabs = ({ erroneousFields }) => {
  console.log(erroneousFields);
  const erroneousTabs = [];
  const tab0ErroneousFields = erroneousFields.filter((item) => formFields[0].includes(item));
  const tab1ErroneousFields = erroneousFields.filter((item) => formFields[1].includes(item));
  const tab2ErroneousFields = erroneousFields.filter((item) => formFields[2].includes(item));

  if (tab0ErroneousFields.length > 0) erroneousTabs.push((0).toString());
  if (tab1ErroneousFields.length > 0) erroneousTabs.push((1).toString());
  if (tab2ErroneousFields.length > 0) erroneousTabs.push((2).toString());

  return erroneousTabs;
};

// Get domains for job monitoring - ASR
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

// Get id for particular monitoring type example "Job Monitoring"
export const getMonitoringTypeId = async ({ monitoringTypeName }) => {
  const options = {
    method: 'GET',
    headers: authHeader(),
  };
  const response = await fetch(`/api/monitorings/getMonitoringTypeId/${monitoringTypeName}`, options);
  console.log('response');
  if (!response.ok) {
    throw new Error('Failed to get monitoring type Id');
  }
  const monitoringTypeId = await response.json();
  return monitoringTypeId;
};
