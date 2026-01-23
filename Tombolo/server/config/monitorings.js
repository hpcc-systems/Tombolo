// Job Monitoring configuration
const jobMonitoringConfig = {
  job_monitoring_interval: 20, // In minutes
  intermediate_job_monitoring_interval: 15, // in minutes
  job_punctuality_monitoring_interval: 10, // in minutes
  job_time_series_analysis_interval: 10, //in minutes
};

// Landing Zone Monitoring configuration
const lz_monitoring_intervals = {
  lz_monitoring_interval: 15,
  lz_file_count_monitoring_interval: 15,
  lz_space_usage_monitoring_interval: 15,
};

// Cluster reachability monitoring configuration
const cluster_monitoring = {
  clusterReachabilityMonitoringInterval: '10m', // in minutes
  passwordExpiryAlertDaysForCluster: [10, 5, 4, 3, 2, 1],
  cluster_monitoring_interval: 10,
  clusterContainerizationCheckInterval: '0 2 * * *', // Daily at 2 AM
};

const cost_monitoring_intervals = {
  monitor_cost_interval: '1 hours',
};

// User account monitoring configuration
const userAccountMonitoring = {
  passwordExpiryAlertDaysForUser: [10, 3, 1],
  accountDeleteAlertDaysForUser: [10, 3, 1],
};

// Export
export default {
  ...jobMonitoringConfig,
  ...cluster_monitoring,
  ...lz_monitoring_intervals,
  ...userAccountMonitoring,
  ...cost_monitoring_intervals,
};
