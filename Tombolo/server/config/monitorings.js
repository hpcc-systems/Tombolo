// Job Monitoring configuration
const job_monitoring_interval = 20; // in minutes
const jobMonitoringConfig = {
  job_monitoring_interval,
  intermediate_job_monitoring_interval: 15, // in minutes
  job_punctuality_monitoring_interval: 10, // in minutes
  job_time_series_analysis_interval: 10, //in minutes
};

// Landing Zone Monitoring configuration
const lz_monitoring_interval = 15;

// Cluster reachability monitoring configuration
const cluster_reachability_monitoring = {
  clusterReachabilityMonitoringInterval: '10m', // in minutes
  passwordExpiryAlertDaysForCluster: [10, 5, 4, 3, 2, 1],
};

// Cluster containerization check configuration
const cluster_containerization_monitoring = {
  clusterContainerizationCheckInterval: '0 2 * * *', // Daily at 2 AM
};

// password expiry alert days for user, we send an email on each day, limited to 3 for now, need to be in descending order to function properly
const passwordExpiryAlertDaysForUser = [10, 3, 1];

// account lock alert days for user, we send an email on eahc day, limited to 3 for now, need to be in descending order to function properly
const accountDeleteAlertDaysForUser = [10, 3, 1];

// Export
module.exports = {
  ...jobMonitoringConfig,
  ...cluster_reachability_monitoring,
  ...cluster_containerization_monitoring,
  passwordExpiryAlertDaysForUser,
  accountDeleteAlertDaysForUser,
  lz_monitoring_interval,
};
