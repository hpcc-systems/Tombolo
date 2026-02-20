const formFields: Record<number, string[]> = {
  0: ['monitoringName', 'description', 'monitoringScope', 'clusterId', 'directoryName'],
  1: ['domain', 'productCategory', 'expectedStartTime', 'expectedCompletionTime', 'severity', 'requireComplete'],
  2: ['notificationCondition', 'teamsHooks', 'primaryContacts', 'secondaryContacts', 'notifyContacts'],
};

export const identifyErroneousTabs = ({ erroneousFields }: { erroneousFields: string[] }): string[] => {
  const erroneousTabs: string[] = [];
  const tab0ErroneousFields = erroneousFields.filter((item) => formFields[0].includes(item));
  const tab1ErroneousFields = erroneousFields.filter((item) => formFields[1].includes(item));
  const tab2ErroneousFields = erroneousFields.filter((item) => formFields[2].includes(item));

  if (tab0ErroneousFields.length > 0) erroneousTabs.push((0).toString());
  if (tab1ErroneousFields.length > 0) erroneousTabs.push((1).toString());
  if (tab2ErroneousFields.length > 0) erroneousTabs.push((2).toString());

  return erroneousTabs;
};

export function isScheduleUpdated({ existingSchedule, newSchedule }: { existingSchedule: any[]; newSchedule: any[] }): boolean {
  if (existingSchedule.length !== newSchedule.length) return true;
  for (let i = 0; i < existingSchedule.length; i++) {
    if (JSON.stringify(existingSchedule[i]) !== JSON.stringify(newSchedule[i])) return true;
  }
  return false;
}

export const convertToMB = (value: number, unit: string): number => {
  const multipliers: Record<string, number> = { MB: 1, GB: 1024, TB: 1024 * 1024, PB: 1024 * 1024 * 1024 };
  return value * (multipliers[unit] || 1);
};

export async function handleLandingZoneMonitoringApproval({
  formData,
  landingZoneMonitoringService,
  handleSuccess,
  handleError,
  applicationId,
  setLandingZoneMonitoring,
  setDisplayApprovalModal,
  flattenObject,
}: any) {
  try {
    await landingZoneMonitoringService.approveMonitoring(formData);
    const updatedLzMonitoringData = await landingZoneMonitoringService.getAll(applicationId);
    const flattenedMonitoring = updatedLzMonitoringData.map((monitoring: any) => {
      const flat = flattenObject(monitoring);
      return { ...flat, ...monitoring };
    });
    setLandingZoneMonitoring(flattenedMonitoring);
    handleSuccess('Response saved successfully');
    setDisplayApprovalModal(false);
  } catch (error) {
    handleError('Failed to updated landing zone monitoring');
  }
}
