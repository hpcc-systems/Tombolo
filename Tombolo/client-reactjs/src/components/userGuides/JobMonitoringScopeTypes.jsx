import React from 'react';

function JobMonitoringScopeTypes() {
  return (
    <div className="guide">
      <h2>Job Monitoring Scope Guide</h2>

      <p>The scope of your job monitoring can be defined in two ways:</p>

      <h3>Specific Job in a Cluster</h3>
      <p>
        Choosing this option requires you to specify the exact name of the job you want to monitor, or a wildcard string
        representing a job name. If the job already exists in the cluster, you can select it from the list. If the job
        doesn&apos;t exist yet, you have the option to manually input the job name in the provided text box.
      </p>

      {/* <h3>Cluster Wide Monitoring</h3>
      <p>
        Selecting this option will monitor the entire cluster. Each time the monitoring process runs, it records the
        time of the run and checks if any new jobs meet the notification or alert criteria.
      </p> */}

      <h3>Monitoring by Job Pattern</h3>
      <p>
        This option allows you to provide a pattern for the job name, such as &quot;routineJob_YYYY_MM_DD&quot;. The
        monitoring process will then match jobs based on this pattern.
      </p>
    </div>
  );
}

export default JobMonitoringScopeTypes;
