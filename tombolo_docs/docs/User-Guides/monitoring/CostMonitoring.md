---
sidebar_position: 5
label: "Cost Monitoring"
title: "Cost Monitoring"
---

**Cost Monitoring** is a powerful feature in Tombolo that continuously tracks compute resource costs across your HPCC clusters to ensure budget compliance and optimize resource utilization. The monitoring system operates from outside the HPCC cluster—directly from Tombolo—and analyzes daily cost data by connecting to cluster workunit information and calculating comprehensive cost breakdowns. It automatically aggregates costs across three key areas: compilation activities, file access operations, and execution processes, providing a complete picture of resource consumption per user and cluster. When configured cost thresholds are exceeded, the system automatically sends detailed notifications to designated recipients, providing proactive budget management and early warning of potential cost overruns before they impact organizational budgets.

---

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Monitoring Types and Frequency
</summary>

**Frequency:**

Cost monitoring runs every hour and analyzes the current day's cost data to determine if thresholds have been exceeded. Only costs accumulated during the current calendar day (00:00 to 23:59) are considered when evaluating against the configured thresholds.

**Monitoring Types:**

Tombolo supports two types of cost monitoring:

- **Cluster Cost Monitoring**: Tracks and analyzes the cost of a cluster or list of clusters across all Workunits.
- **User Cost Monitoring**: Tracks and analyzes cost for a user or list of users across all Workunits for the specified clusters.

Both monitoring types can be configured to track either individual costs (per cluster/user) or combined costs across multiple clusters/users, allowing for flexible threshold monitoring based on summed resource utilization.

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Setting Up Cost Monitoring
</summary>

To set up cost monitoring in Tombolo, follow these steps. After creating the monitoring, it must be approved and activated for the monitoring to take effect.

1. Access the **Monitoring** menu from the left navigation bar and select **Cost**.
2. This will navigate you to the Cost Monitoring page.
3. On the top-right corner, click the **Cost Monitoring Actions** button and select **Add Cost Monitoring**.
4. A modal with multiple tabs will appear. Complete the required details in each tab. Alternatively, you can duplicate an existing monitor by clicking 'More' under the Actions menu in the Cost Monitoring table.

### **Tab 1: Basic Information**

This tab collects essential details about the cost monitoring setup:

1. **Monitoring Name**: A unique, descriptive name for your monitor.
2. **Description**: Detailed description of what this monitor does and its purpose.
3. **Monitor By/Type**: Select either user or cluster cost monitoring.
4. **Clusters**: Select cluster(s) which you want to be monitored.
5. **Users**: Enter user(s) that you want to monitor. These would be the owner of a workunit (only shown when "Monitor By" is set to user).

### **Tab 2: Notifications**

This tab configures how and when notifications are sent:

1. **Cost Threshold**: The threshold for combined workunit cost across the cluster(s) and user(s) entered in the basic tab for 24 hours.
   - **Per Item or Total Dropdown**: This dropdown allows you to specify if the threshold is for each individual user/cluster or the summed cost of all users/clusters.
2. **Primary Contact(s)**: Main recipients who will receive all alerts (required).

Once saved, the monitor will be created with **Pending** approval status. All monitors require approval before they can be activated. When approved by authorized personnel, the monitor can be set to run by clicking the power button to activate monitoring.

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Managing Cost Monitors
</summary>

Once monitors are created, various actions are available to manage them:

**Individual Monitor Actions:**

- **View**: View detailed configuration and status of a monitor.
- **Edit**: Modify monitor settings (requires re-approval after editing).
- **Approve/Reject**: Authorized personnel can approve or reject pending monitors.
- **Pause/Start**: Toggle monitor active status using the power button.
- **Duplicate**: Create a copy of an existing monitor with similar settings.
- **Delete**: Remove a monitor from the system.

**Bulk Actions:**

- **Bulk Edit**: Modify multiple monitors simultaneously.
- **Bulk Delete**: Remove multiple monitors at once.
- **Bulk Approve/Reject**: Approve or reject multiple pending monitors together.

These actions help streamline monitor management, especially when dealing with multiple monitors across different environments.

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Backend Process
</summary>

Once a monitor is approved and activated, the backend monitoring system automatically picks it up and begins the monitoring process:

1. **Job Scheduling**: The Monitoring job is scheduled to run at regular intervals (default: every hour).
2. **Workunit Cost Retrieval**: The system connects to the specified cluster(s) and retrieves all Workunits since it last ran or the start of the day for the cluster. Then it collects the costs.
3. **Threshold Evaluation**: The system checks if the total costs for a monitor exceeds the Cost threshold.
4. **Alert Generation**: If a threshold is exceeded, notifications are generated and sent.

Each monitoring cycle performs the following actions:

- Establish connection to the HPCC cluster using Workunit services.
- Retrieve current workunit information and cost data for the monitored time period.
- Extract user-specific cost breakdowns from workunit metadata.
- Calculate cumulative costs across:
  - Compilation
  - File access
  - Execution activities
- Aggregate total costs based on scope for the current day.
- Compare aggregated costs against configured thresholds.

The system detects and alerts on cost threshold breaches when the given scope's costs across the specified cluster(s) exceed the specified dollar amounts, and budget overruns that occur during the monitoring period (full day).

When cost thresholds are exceeded, alerts are sent immediately with detailed information including total cost amount, individual user cost contributions, and timestamp of when the threshold was exceeded. Notifications are sent via configured channels (email) and delivered to all configured contact groups including primary contacts, secondary contacts, and notification recipients based on the monitoring configuration.

</details>
</div>
