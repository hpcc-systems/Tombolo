//Function that checks if the  job schedule is correct
interface IntermittentScheduling {
  frequency: string;
  scheduleBy?: string;
  days?: string[];
  dates?: number[];
  weeks?: string[];
  day?: string;
  month?: string;
  date?: number;
  week?: string;
  runWindow?: string | null;
  [key: string]: any;
}

interface CronMessage {
  valid: boolean;
  message?: string;
}

interface ScheduleValidityResult {
  valid: boolean;
  schedule: IntermittentScheduling[];
}

export const checkScheduleValidity = ({
  intermittentScheduling,
  completeSchedule,
  cron,
  cronMessage,
}: {
  intermittentScheduling: IntermittentScheduling;
  completeSchedule: IntermittentScheduling[];
  cron: string | null;
  cronMessage: CronMessage | null;
}): ScheduleValidityResult => {
  // Abandon intermittent schedule if user did not completely add the schedule.Eg if they submit form and schedule was partially entered
  const { frequency, scheduleBy, days, dates, weeks, day, month, date, week } = intermittentScheduling;
  let allSchedule = [...completeSchedule];
  if (frequency === 'anytime') {
    allSchedule = [{ frequency: 'anytime', runWindow: null }];
  } else if (frequency === 'daily') {
    allSchedule = [...completeSchedule, intermittentScheduling];
  } else if (frequency === 'weekly' && days?.length && days.length > 0) {
    allSchedule = [...completeSchedule, intermittentScheduling];
  } else if (frequency === 'monthly' && scheduleBy === 'dates' && dates?.length && dates.length > 0) {
    allSchedule = [...completeSchedule, intermittentScheduling];
  } else if (frequency === 'monthly' && scheduleBy === 'weeks-day' && weeks?.length && weeks.length > 0 && day) {
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
const formFields: Record<number, string[]> = {
  0: ['monitoringName', 'description', 'monitoringScope', 'clusterId', 'jobName'],
  1: ['domain', 'productCategory', 'expectedStartTime', 'expectedCompletionTime', 'severity', 'requireComplete'],
  2: ['notificationCondition', 'primaryContacts', 'secondaryContacts', 'notifyContacts'],
};

export const identifyErroneousTabs = ({ erroneousFields }: { erroneousFields: string[] }): string[] => {
  const erroneousTabs: string[] = [];
  const tab0ErroneousFields = erroneousFields.filter(item => formFields[0].includes(item));
  const tab1ErroneousFields = erroneousFields.filter(item => formFields[1].includes(item));
  const tab2ErroneousFields = erroneousFields.filter(item => formFields[2].includes(item));

  if (tab0ErroneousFields.length > 0) erroneousTabs.push((0).toString());
  if (tab1ErroneousFields.length > 0) erroneousTabs.push((1).toString());
  if (tab2ErroneousFields.length > 0) erroneousTabs.push((2).toString());

  return erroneousTabs;
};

// Check if 2 schedule are the same
export function isScheduleUpdated({
  existingSchedule,
  newSchedule,
}: {
  existingSchedule: IntermittentScheduling[];
  newSchedule: IntermittentScheduling[];
}): boolean {
  if (existingSchedule.length !== newSchedule.length) return true;
  for (let i = 0; i < existingSchedule.length; i++) {
    if (JSON.stringify(existingSchedule[i]) !== JSON.stringify(newSchedule[i])) return true;
  }
  return false;
}

// Check if new name job monitoring name already exists
export function doesNameExist({ jobMonitorings, newName }: { jobMonitorings: any[]; newName: string }): boolean {
  return jobMonitorings.some(job => job.monitoringName === newName);
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
}: {
  formData: any;
  jobMonitoringService: any;
  handleSuccess: (message: string) => void;
  handleError: (message: string) => void;
  applicationId: string;
  setJobMonitorings: (monitorings: any[]) => void;
  setDisplayAddRejectModal: (display: boolean) => void;
}): Promise<void> {
  try {
    await jobMonitoringService.evaluate(formData);
    handleSuccess('Job monitoring evaluated successfully');

    // Refetch and set job monitoring data
    const updatedMonitorings = await jobMonitoringService.getAll({ applicationId });
    setJobMonitorings(updatedMonitorings);

    // Close the modal
    setDisplayAddRejectModal(false);
  } catch (_error) {
    handleError('Unable to evaluate job monitoring');
  }
}
