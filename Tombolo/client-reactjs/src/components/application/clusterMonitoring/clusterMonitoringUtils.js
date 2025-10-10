// Utility functions with actual business logic

// Find a unique name for the monitoring
export const findUniqueName = (name, clusterMonitoring) => {
  let i = 1;
  let newName = name + ' ( ' + i + ' )';
  while (clusterMonitoring.find((monitoring) => monitoring.monitoringName === newName)) {
    i++;
    newName = name + ' ( ' + i + ' )';
  }

  return newName;
};

// Identify erroneous tab(s)
const formFields = {
  0: ['monitoringName', 'description', 'clusterMonitoringType', 'clusterId', 'jobName'],
  1: ['primaryContacts'],
};

export const identifyErroneousTabs = ({ erroneousFields }) => {
  const erroneousTabs = [];
  const tab0ErroneousFields = erroneousFields.filter((item) => formFields[0].includes(item));
  const tab1ErroneousFields = erroneousFields.filter((item) => formFields[1].includes(item));

  if (tab0ErroneousFields.length > 0) erroneousTabs.push((0).toString());
  if (tab1ErroneousFields.length > 0) erroneousTabs.push((1).toString());

  return erroneousTabs;
};

// handleBulkUpdateClusterMonitoring removed - use clusterMonitoringService.bulkUpdate directly
