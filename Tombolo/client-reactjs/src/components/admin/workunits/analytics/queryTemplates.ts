type QueryTemplate = {
  name: string;
  description: string;
  sql: string;
};

const QUERY_TEMPLATES: Record<string, QueryTemplate[]> = {
  'Performance Analysis': [
    {
      name: 'Top 10 Longest Running Jobs with Cluster Name (Last 7 Days)',
      description: 'Find the slowest jobs in the past week with cluster names',
      sql: `SELECT 
  wu.wuId,
  wu.jobName,
  c.name as clusterName,
  wu.state,
  wu.totalCost,
  wu.compileCost,
  wu.executeCost,
  wu.workUnitTimestamp
FROM work_units wu
LEFT JOIN clusters c ON wu.clusterId = c.id
WHERE wu.workUnitTimestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY wu.totalCost DESC
LIMIT 10`,
    },
    {
      name: 'Jobs with Increasing Duration Trend',
      description: 'Identify jobs getting slower over time',
      sql: `SELECT 
  jobName,
  COUNT(*) as run_count,
  AVG(totalCost) as avg_duration,
  MIN(totalCost) as min_duration,
  MAX(totalCost) as max_duration,
  STD(totalCost) as std_deviation
FROM work_units
WHERE workUnitTimestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY jobName
HAVING run_count > 5
ORDER BY std_deviation DESC
LIMIT 20`,
    },
    {
      name: 'Slowest Activities Across All Jobs',
      description: 'Find performance bottlenecks in activities',
      sql: `SELECT 
  scopeName,
  scopeType,
  AVG(TimeLocalExecute) as avg_time,
  COUNT(*) as occurrence_count,
  MAX(TimeLocalExecute) as max_time
FROM work_unit_details
WHERE scopeType = 'activity'
  AND TimeLocalExecute > 0
GROUP BY scopeName, scopeType
ORDER BY avg_time DESC
LIMIT 25`,
    },
  ],
  'Failure Analysis': [
    {
      name: 'Failed Workunits Today with Cluster Names',
      description: 'All failures from today with cluster information',
      sql: `SELECT 
  wu.wuId,
  wu.jobName,
  c.name as clusterName,
  wu.state,
  wu.owner,
  wu.workUnitTimestamp,
  wu.totalCost
FROM work_units wu
LEFT JOIN clusters c ON wu.clusterId = c.id
WHERE DATE(wu.workUnitTimestamp) = CURDATE()
  AND wu.state IN ('failed', 'aborted')
ORDER BY wu.workUnitTimestamp DESC`,
    },
    {
      name: 'Most Common Failure Patterns',
      description: 'Group failures by job name',
      sql: `SELECT 
  jobName,
  state,
  COUNT(*) as failure_count,
  MAX(workUnitTimestamp) as last_failure,
  AVG(totalCost) as avg_duration_before_fail
FROM work_units
WHERE state IN ('failed', 'aborted')
  AND workUnitTimestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY jobName, state
ORDER BY failure_count DESC
LIMIT 20`,
    },
    {
      name: 'Jobs with High Failure Rate',
      description: 'Calculate failure percentage by job',
      sql: `SELECT 
  jobName,
  COUNT(*) as total_runs,
  SUM(CASE WHEN state IN ('failed', 'aborted') THEN 1 ELSE 0 END) as failures,
  ROUND(100.0 * SUM(CASE WHEN state IN ('failed', 'aborted') THEN 1 ELSE 0 END) / COUNT(*), 2) as failure_rate_pct
FROM work_units
WHERE workUnitTimestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY jobName
HAVING total_runs >= 5
ORDER BY failure_rate_pct DESC
LIMIT 20`,
    },
  ],
  'Workload Analysis': [
    {
      name: 'Workunits by Cluster with Names (Last 30 Days)',
      description: 'Distribution of work across clusters with cluster names',
      sql: `SELECT 
  c.name as clusterName,
  wu.clusterId,
  COUNT(*) as workunit_count,
  COUNT(DISTINCT wu.jobName) as unique_jobs,
  AVG(wu.totalCost) as avg_duration,
  SUM(wu.totalCost) as total_compute_time
FROM work_units wu
LEFT JOIN clusters c ON wu.clusterId = c.id
WHERE wu.workUnitTimestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY c.name, wu.clusterId
ORDER BY workunit_count DESC`,
    },
    {
      name: 'Peak Usage Hours',
      description: 'Find busiest times of day',
      sql: `SELECT 
  HOUR(workUnitTimestamp) as hour_of_day,
  COUNT(*) as workunit_count,
  AVG(totalCost) as avg_duration
FROM work_units
WHERE workUnitTimestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY hour_of_day
ORDER BY hour_of_day`,
    },
    {
      name: 'Top Users by Workunit Count',
      description: 'Most active users',
      sql: `SELECT 
  owner,
  COUNT(*) as workunit_count,
  COUNT(DISTINCT jobName) as unique_jobs,
  AVG(totalCost) as avg_duration,
  SUM(totalCost) as total_compute_time
FROM work_units
WHERE workUnitTimestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY owner
ORDER BY workunit_count DESC
LIMIT 20`,
    },
  ],
  'WorkUnits Table Queries': [
    {
      name: 'Recent Workunits with Cluster Names',
      description: 'Latest workunits from the work_units table with cluster information',
      sql: `SELECT 
  wu.wuId,
  wu.jobName,
  c.name as clusterName,
  wu.owner,
  wu.state,
  wu.createdAt
FROM work_units wu
LEFT JOIN clusters c ON wu.clusterId = c.id
ORDER BY wu.createdAt DESC
LIMIT 50`,
    },
    {
      name: 'Workunit Count by Cluster (WorkUnits Table)',
      description: 'Count workunits per cluster from work_units table',
      sql: `SELECT 
  c.name as clusterName,
  wu.clusterId,
  COUNT(*) as workunit_count,
  COUNT(DISTINCT wu.jobName) as unique_jobs,
  MAX(wu.createdAt) as latest_workunit
FROM work_units wu
LEFT JOIN clusters c ON wu.clusterId = c.id
GROUP BY c.name, wu.clusterId
ORDER BY workunit_count DESC`,
    },
    {
      name: 'Workunits by Owner with Cluster Names',
      description: 'Workunit distribution by owner from work_units table',
      sql: `SELECT 
  wu.owner,
  COUNT(*) as workunit_count,
  COUNT(DISTINCT wu.clusterId) as clusters_used,
  COUNT(DISTINCT wu.jobName) as unique_jobs,
  MIN(wu.createdAt) as first_workunit,
  MAX(wu.createdAt) as latest_workunit
FROM work_units wu
GROUP BY wu.owner
ORDER BY workunit_count DESC
LIMIT 20`,
    },
  ],
  'Scope Deep Dive': [
    {
      name: 'Most Time-Consuming Scopes',
      description: 'Scopes with highest total execution time',
      sql: `SELECT 
  scopeName,
  scopeType,
  COUNT(*) as occurrence_count,
  SUM(TimeLocalExecute) as total_time,
  AVG(TimeLocalExecute) as avg_time,
  MAX(TimeLocalExecute) as max_time
FROM work_unit_details
WHERE TimeLocalExecute > 0
GROUP BY scopeName, scopeType
ORDER BY total_time DESC
LIMIT 25`,
    },
    {
      name: 'Activities by Average Duration',
      description: 'Slowest activity types',
      sql: `SELECT 
  scopeName,
  COUNT(*) as run_count,
  AVG(TimeLocalExecute) as avg_duration,
  MIN(TimeLocalExecute) as min_duration,
  MAX(TimeLocalExecute) as max_duration
FROM work_unit_details
WHERE scopeType = 'activity'
  AND TimeLocalExecute > 0
GROUP BY scopeName
HAVING run_count >= 10
ORDER BY avg_duration DESC
LIMIT 20`,
    },
    {
      name: 'Graph Execution Distribution',
      description: 'Analyze graph-level performance',
      sql: `SELECT 
  scopeName,
  COUNT(*) as execution_count,
  AVG(TimeLocalExecute) as avg_time,
  SUM(TimeLocalExecute) as total_time,
  STD(TimeLocalExecute) as std_deviation
FROM work_unit_details
WHERE scopeType = 'graph'
  AND TimeLocalExecute > 0
GROUP BY scopeName
ORDER BY total_time DESC
LIMIT 15`,
    },
  ],
};

export default QUERY_TEMPLATES;
