---
sidebar_position: 1
label: "Landing Zone Monitoring"
title: "Landing Zone Monitoring"
---

Landing Zone Monitoring is a powerful feature in Tombolo that continuously watches specified directories on your HPCC cluster's landing zones for file activity. The monitoring system operates completely from outside the HPCC cluster - directly from Tombolo - and reaches out to specified directories every 30 minutes (this interval is configurable). It uses the HPCC File Spray services to access landing zone directories and analyze file activity based on your configured parameters. When anomalies are detected, the system automatically sends notifications to designated recipients, providing proactive issue detection before problems impact downstream processes.

---

## Monitoring Types and Frequency

Tombolo supports three types of landing zone monitoring:

- **File Movement Monitoring**: Tracks files as they move through the landing zone, alerting when files exceed expected processing times
- **File Count Monitoring**: Monitors the number of files in specified directories over time, alerting when file counts exceed expected thresholds
- **Space Usage Monitoring**: Tracks storage space utilization in landing zone directories, alerting when storage usage exceeds configured limits

**Note**: Currently, only File Movement Monitoring is fully implemented and available for use. File Count and Space Usage monitoring are work in progress features.

---

## Setting up Landing Zone Monitoring

To access the Landing Zone Monitoring page, click on **Monitoring** from the left navigation bar and then click on **Landing Zone Monitoring** link. You'll see a list of existing monitors (if any) and actions to manage them. To create a new monitor, click the **LZ Monitoring Actions** button and select **Add LZ Monitoring** option. Fill up all the details in the form - all mandatory fields are labeled with \*.

**Basic Tab:**

- **Monitoring Name**: A unique, descriptive name for your monitor
- **Description**: Detailed description of what this monitor does and its purpose
- **Domain**: Select the business domain this monitor belongs to (ASR integration)
- **Product Category**: Choose the relevant product category (ASR integration)
- **Severity**: Set the criticality level (ASR integration)

**Monitoring Details Tab:**

- **Monitoring Type**: Currently only "File Movement" is available
- **Cluster**: Choose the HPCC cluster to monitor
- **Dropzone**: Select the landing zone from the dropdown (populated based on cluster selection)
- **Machine**: Choose the specific machine/server within the dropzone
- **Directory**: Navigate to the directory you want to monitor using the directory browser

For File Movement monitoring type:

- **Threshold (in minutes)**: Maximum time a file should remain in the directory before alerting
- **Maximum Depth**: Number of subdirectory levels to monitor (0 for all directories)
- **File Name**: Use wildcards to match files (e.g., `data_*.csv`, `report_??_*.txt`)

**Notification Tab:**

- **Primary Contact(s)**: Main recipients who will receive all alerts (required)
- **Secondary Contact(s)**: Additional recipients for alerts (optional, available only if ASR integration is on)
- **Notify Contact(s)**: Recipients for informational notifications (optional, available only if ASR integration is on)

Once saved, the monitor will be created with **Pending** approval status. All monitors require approval before they can be activated. When approved by authorized personnel, the monitor can be set to run by clicking the power button to activate monitoring.

---

## Managing Landing Zone Monitors

Once monitors are created, various actions are available to manage them:

**Individual Monitor Actions:**

- **View**: View detailed configuration and status of a monitor
- **Edit**: Modify monitor settings (requires re-approval after editing)
- **Approve/Reject**: Authorized personnel can approve or reject pending monitors
- **Pause/Start**: Toggle monitor active status using the power button
- **Duplicate**: Create a copy of an existing monitor with similar settings
- **Delete**: Remove a monitor from the system

**Bulk Actions:**

- **Bulk Edit**: Modify multiple monitors simultaneously
- **Bulk Delete**: Remove multiple monitors at once
- **Bulk Approve/Reject**: Approve or reject multiple pending monitors together

These actions help streamline monitor management, especially when dealing with multiple monitors across different environments.

---

## Backend Process

Once a monitor is approved and activated, the backend monitoring system automatically picks it up and begins the monitoring process:

1. **Job Scheduling**: The monitoring job is scheduled to run at regular intervals (default: every 30 minutes)
2. **Directory Access**: The system connects to the specified cluster and accesses the designated landing zone directory
3. **File Analysis**: Files in the directory are analyzed based on your configured parameters:
   - File name pattern matching using wildcards
   - File timestamps to track how long files have been present
   - File movement tracking between monitoring cycles
4. **Threshold Evaluation**: The system compares actual file behavior against your configured thresholds
5. **Alert Generation**: When anomalies are detected, notifications are automatically generated and sent

Each monitoring cycle performs the following actions: establish connection to the HPCC cluster using File Spray services, retrieve current list of files in the monitored directory (and subdirectories if configured), filter files based on the specified file name patterns, calculate how long each matching file has been in the directory, compare file ages against the configured threshold, and send alerts for files that exceed the threshold or match alert conditions.

The system detects and alerts on stuck files that remain in the directory longer than the specified threshold, new file detection when new files matching your pattern arrive (if configured), file size issues that fall outside expected size ranges (if configured), and processing delays when files haven't moved within expected timeframes.

When anomalies are detected, alerts are sent immediately when thresholds are breached with detailed information including file name and location, how long the file has been present, expected vs. actual processing time, and cluster and directory information. Notifications are sent via configured channels (email, Microsoft Teams) and escalated to all configured contact groups based on severity.

---
