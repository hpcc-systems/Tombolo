---
sidebar_position: 1
label: "Landing Zone Monitoring"
title: "Landing Zone Monitoring"
---

Landing Zone Monitoring in Tombolo continuously watches specified directories on your HPCC cluster's landing zones for file activity. The monitoring system operates from outside the HPCC cluster—directly from Tombolo—and reaches out to specified directories at regular intervals (default: every 30 minutes, configurable). It uses HPCC File Spray services to access landing zone directories and analyze file activity based on your configured parameters. When anomalies are detected, the system automatically sends notifications to designated recipients, providing proactive issue detection before problems impact downstream processes.

---

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Monitoring Types and Frequency
</summary>

Tombolo supports three types of landing zone monitoring:

- **File Movement Monitoring**: Tracks files as they move through the landing zone, alerting when files exceed expected processing times.
- **File Count Monitoring**: Monitors the number of files in specified directories over time, alerting when file counts exceed expected thresholds.
- **Space Usage Monitoring**: Tracks storage space utilization in landing zone directories, alerting when storage usage exceeds configured limits.

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Setting Up Landing Zone Monitoring
</summary>

To set up landing zone monitoring in Tombolo, follow these steps. After creating the monitoring, it must be approved and activated for the monitoring to take effect.

1. Access the **Monitoring** menu from the left navigation bar and select **Landing Zone Monitoring**.
2. This will navigate you to the Landing Zone Monitoring page.
3. On the top-right corner, click the **LZ Monitoring Actions** button and select **Add LZ Monitoring**.
4. A modal with multiple tabs will appear. Complete the required details in each tab. Alternatively, you can duplicate an existing monitor by clicking 'More' under the Actions menu in the Landing Zone Monitoring table.

### **Tab 1: Basic Information**

This tab collects essential details about the landing zone monitoring setup:

1. **Monitoring Name**: A unique, descriptive name for your monitor.
2. **Description**: Detailed description of what this monitor does and its purpose.
3. **Domain**: Select the business domain this monitor belongs to (ASR integration).
4. **Product Category**: Choose the relevant product category (ASR integration).
5. **Severity**: Set the criticality level (ASR integration).

### **Tab 2: Monitoring Details**

This tab defines the technical parameters for monitoring:

1. **Monitoring Type**: File Movement, File Count, or Space Usage.
2. **Cluster**: Choose the HPCC cluster to monitor.
3. **Dropzone**: Select the landing zone from the dropdown (populated based on cluster selection).
4. **Machine**: Choose the specific machine/server within the dropzone.
5. **Directory**: Navigate to the directory you want to monitor using the directory browser.

**Monitoring type-specific fields:**

- **File Movement:**
  - **Threshold (in minutes):** Maximum time a file should remain in the directory before alerting.
  - **Maximum Depth:** Number of subdirectory levels to monitor (0 for all directories).
  - **File Name:** Use [wildcards](/docs/User-Guides/Wildcards) to match files (e.g., `data_*.csv`, `report_??_*.txt`).
- **File Count:**
  - **Minimum File Count:** Minimum number of files allowed in the directory before alerting.
  - **Maximum File Count:** Maximum number of files allowed in the directory before alerting.
- **Space Usage:**
  - **Minimum Threshold (in MB/GB/TB/PB):** Minimum storage space allowed in the directory before alerting.
  - **Maximum Threshold (in MB/GB/TB/PB):** Maximum storage space allowed in the directory before alerting.

### **Tab 3: Notification**

This tab configures how and when notifications are sent:

1. **Primary Contact(s):** Main recipients who will receive all alerts (required).
2. **Secondary Contact(s):** Additional recipients for alerts (optional, available only if ASR integration is on).
3. **Notify Contact(s):** Recipients for informational notifications (optional, available only if ASR integration is on).

Once saved, the monitor will be created with **Pending** approval status. All monitors require approval before they can be activated. When approved by authorized personnel, the monitor can be set to run by clicking the power button to activate monitoring.

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Managing Landing Zone Monitors
</summary>

Once monitors are created, various actions are available to manage them:

**Individual Monitor Actions:**

- **View:** View detailed configuration and status of a monitor.
- **Edit:** Modify monitor settings (requires re-approval after editing).
- **Approve/Reject:** Authorized personnel can approve or reject pending monitors.
- **Pause/Start:** Toggle monitor active status using the power button.
- **Duplicate:** Create a copy of an existing monitor with similar settings.
- **Delete:** Remove a monitor from the system.

**Bulk Actions:**

- **Bulk Edit:** Modify multiple monitors simultaneously.
- **Bulk Delete:** Remove multiple monitors at once.
- **Bulk Approve/Reject:** Approve or reject multiple pending monitors together.

These actions help streamline monitor management, especially when dealing with multiple monitors across different environments.

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Backend Process
</summary>

Once a monitor is approved and activated, the backend monitoring system automatically picks it up and begins the monitoring process:

1. **Job Scheduling:** The monitoring job is scheduled to run at regular intervals (default: every 30 minutes).
2. **Directory Access:** The system connects to the specified cluster and accesses the designated landing zone directory.
3. **File Analysis:** Files in the directory are analyzed based on your configured parameters:
   - File name pattern matching using [wildcards](/docs/User-Guides/Wildcards).
   - File timestamps to track how long files have been present.
   - File movement tracking between monitoring cycles.
4. **Threshold Evaluation:** The system compares actual file behavior against your configured thresholds.
5. **Alert Generation:** When anomalies are detected, notifications are automatically generated and sent.

Each monitoring cycle performs the following actions: establish connection to the HPCC cluster using File Spray services, retrieve current list of files in the monitored directory (and subdirectories if configured), filter files based on the specified file name patterns, calculate how long each matching file has been in the directory, compare file ages against the configured threshold, and send alerts for files that exceed the threshold or match alert conditions.

The system detects and alerts on stuck files that remain in the directory longer than the specified threshold, new file detection when new files matching your pattern arrive (if configured), file size issues that fall outside expected size ranges (if configured), and processing delays when files haven't moved within expected timeframes.

When anomalies are detected, alerts are sent immediately when thresholds are breached with detailed information including file name and location, how long the file has been present, expected vs. actual processing time, and cluster and directory information. Notifications are sent via email and escalated to all configured contact groups based on severity.

</details>
</div>
