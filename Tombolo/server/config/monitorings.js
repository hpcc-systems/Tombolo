// Job Monitoring configuration
const job_monitoring_interval = 30; // in minutes
const jobMonitoringConfig = {
  job_monitoring_interval,
  intermediate_job_monitoring_interval: 10, // in minutes
  job_punctuality_monitoring_interval: job_monitoring_interval + 10
};


// Export
module.exports = {
    ...jobMonitoringConfig
}