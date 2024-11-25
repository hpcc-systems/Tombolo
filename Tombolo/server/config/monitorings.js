// Job Monitoring configuration
const job_monitoring_interval = 20; // in minutes
const jobMonitoringConfig = {
  job_monitoring_interval,
  intermediate_job_monitoring_interval: 15, // in minutes
  job_punctuality_monitoring_interval: 10, // in minutes
};


// Cluster reachability monitoring configuration
const cluster_reachability_monitoring = {
  clusterReachabilityMonitoringInterval: "at 00:10 am also at 11:50pm",
  passwordExpiryAlertDaysForCluster: [10, 5, 4, 3, 2, 1],
};

// Export
module.exports = {
    ...jobMonitoringConfig,
    ...cluster_reachability_monitoring
}