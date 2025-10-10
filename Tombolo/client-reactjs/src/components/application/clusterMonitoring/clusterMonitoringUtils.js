import clusterMonitoringService from '@/services/clusterMonitoring.service';

// Create a new cluster monitoring
export const createClusterMonitoring = async (data) => {
  return await clusterMonitoringService.create(data);
};

// Get all cluster monitoring data
export const getAllClusterMonitoring = async () => {
  return await clusterMonitoringService.getAll();
};

// Update existing cluster monitoring
export const updateClusterMonitoring = async (data) => {
  return await clusterMonitoringService.update(data);
};

// Approve or Reject cluster monitoring
export const evaluateClusterMonitoring = async (data) => {
  return await clusterMonitoringService.evaluate(data);
};

// Toggle cluster monitoring is active status
export const toggleClusterMonitoringActiveStatus = async ({ ids, isActive }) => {
  return await clusterMonitoringService.toggleBulk({ ids, isActive });
};

// Toggle single -> /toggle
export const toggleSingleClusterMonitoringActiveStatus = async (id) => {
  return await clusterMonitoringService.toggleSingle(id);
};

// Delete cluster monitoring
export const deleteClusterMonitoring = async (id) => {
  return await clusterMonitoringService.delete(id);
};

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

export const handleBulkUpdateClusterMonitoring = async ({ updatedData }) => {
  return await clusterMonitoringService.bulkUpdate({ updatedData });
};
