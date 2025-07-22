import React from 'react';

const LandingZoneMonitoringTypes = () => {
  return (
    <div className="guide">
      <h2>Landing Zone Monitoring Types</h2>
      <p>
        Tombolo supports three different types of landing zone monitoring to help you track various aspects of your data
        landing zones.
      </p>

      <h3>Monitoring Types</h3>

      <h4>Landing Zone Space</h4>
      <p>
        <span>Monitors the disk space usage</span> within the selected landing zone directory to alert you when space
        thresholds are exceeded.
      </p>
      <p>
        <span>Note:</span> This monitoring type is only available for <span>bare metal clusters</span>. It is disabled
        for containerized clusters due to architectural differences in how storage is managed.
      </p>

      <h4>File(s) Not Moving</h4>
      <p>
        <span>Monitors files that remain in a directory longer than expected</span> by tracking when files haven&apos;t
        moved within a specified time threshold.
      </p>

      <h4>File Count in a Directory</h4>
      <p>
        <span>Monitors the number of files in a directory</span> and alerts when the file count falls outside the
        specified minimum and maximum thresholds.
      </p>
    </div>
  );
};

export default LandingZoneMonitoringTypes;
