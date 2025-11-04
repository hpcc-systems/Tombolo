//Function that checks if the  job schedule is correct
export const checkScheduleValidity = ({ intermittentScheduling, completeSchedule, cron, cronMessage }) => {
  // Abandon intermittent schedule if user did not completely add the schedule.Eg if they submit form and schedule was partially entered
  const { frequency, scheduleBy, days, dates, weeks, day, month, date, week } = intermittentScheduling;
  let allSchedule = [...completeSchedule];
  if (frequency === 'anytime') {
    allSchedule = [{ frequency: 'anytime', runWindow: null }];
  } else if (frequency === 'daily') {
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

// Handle job monitoring evaluation with success/error handling and data refresh
export async function handleJobMonitoringEvaluation({
  formData,
  jobMonitoringService,
  handleSuccess,
  handleError,
  applicationId,
  setJobMonitorings,
  setDisplayAddRejectModal,
}) {
  try {
    await jobMonitoringService.evaluate(formData);
    handleSuccess('Job monitoring evaluated successfully');

    // Refetch and set job monitoring data
    const updatedMonitorings = await jobMonitoringService.getAll({ applicationId });
    setJobMonitorings(updatedMonitorings);

    // Close the modal
    setDisplayAddRejectModal(false);
  } catch (error) {
    handleError('Unable to evaluate job monitoring');
  }
}
