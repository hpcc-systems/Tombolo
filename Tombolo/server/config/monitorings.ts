// Job Monitoring configuration
export const job_monitoring_interval = 20 as const; // In minutes
export const intermediate_job_monitoring_interval = 15 as const; // in minutes
export const job_punctuality_monitoring_interval = 10 as const; // in minutes
export const job_time_series_analysis_interval = 10 as const; //in minutes

// Landing Zone Monitoring configuration
export const lz_monitoring_interval = 15 as const;
export const lz_file_count_monitoring_interval = 15 as const;
export const lz_space_usage_monitoring_interval = 15 as const;

// Cluster reachability monitoring configuration
export const clusterReachabilityMonitoringInterval = '10m' as const; // in minutes
export const passwordExpiryAlertDaysForCluster = [10, 5, 4, 3, 2, 1] as const;
export const cluster_monitoring_interval = 10 as const;
export const clusterContainerizationCheckInterval = '0 2 * * *' as const; // Daily at 2 AM

export const monitor_cost_interval = '1 hours' as const;

// User account monitoring configuration
export const passwordExpiryAlertDaysForUser = [10, 3, 1] as const;
export const accountDeleteAlertDaysForUser = [10, 3, 1] as const;
