---
sidebar_position: 5
label: "Cost Monitoring"
title: "Cost Monitoring"
---

**Cost Monitoring** is a powerful feature in Tombolo that continuously tracks compute resource costs across your HPCC clusters to ensure budget compliance and optimize resource utilization. The monitoring system operates completely from outside the HPCC cluster - directly from Tombolo - and analyzes daily cost data by connecting to cluster workunit information and calculating comprehensive cost breakdowns. It automatically aggregates costs across three key areas: compilation activities, file access operations, and execution processes, providing a complete picture of resource consumption per user and cluster. When configured cost thresholds are exceeded, the system automatically sends detailed notifications to designated recipients, providing proactive budget management and early warning of potential cost overruns before they impact organizational budgets.

---

# Monitoring Types and Frequency

As of right now Tombolo only supports one type of cost monitoring

- **Aggregated Daily Cost Monitoring**: Tracks cost for a user or list of users for the day, combining all three workunit costs (compile, execute, and file access) across all workunits.

---

## Setting up Cost Monitoring

To access the Cost Monitoring page, click on **Monitoring** from the left navigation bar and then click on **Cost**. You will see a list of existing monitors (if any) and actions to manage them. To create a new monitor, click the **Cost Monitoring Actions** button and select **Add Cost Monitoring**. Fill in all required fields of the form that are labeled with \*.

**Basic Tab:**

- **Monitoring Name**: A unique, descriptive name for your monitor
- **Description** : Detailed description of what this monitor does and its purpose
- **Clusters**: Select cluster(s) which you want to be monitored
- **Users**: Enter user(s) that you want to monitor. These would be the owner of a workunit

**Notifications Tab:**

- **Cost Threshold**: The threshold for combined workunit cost across the cluster(s) and user(s) entered in the basic tab for 24 hours.
- **Primary Contact(s)**: Main recipients who will receive all alerts (required)

Once saved, the monitor will be created with **Pending** approval status. All monitors require approval before they can be activated. When approved by authorized personnel, the monitor can be set to run by clicking the power button to activate monitoring.

---

## Managing Cost Monitors

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

1. **Job Scheduling**: The Monitoring job is scheduled to run at regular intervals (default: every hour)
2. **Workunit Cost Retrieval**: The system connects to the specified cluster(s) and retrieves all Workunits since it last ran or the start of the day for the cluster. Then it collects the costs.
3. **Threshold Evaluation**: The system checks if the total costs for a monitor exceeds the Cost threshold.
4. **Alert Generation**: If a threshold is exceeded, notifications are generated and sent.

Each monitoring cycle performs the following actions: establish connection to the HPCC cluster using Workunit services, retrieve current workunit information and cost data for the monitored time period, extract user-specific cost breakdowns from workunit metadata, calculate cumulative costs across compilation, file access, and execution activities, aggregate total costs per user for the current day, and compare aggregated costs against configured thresholds.

The system detects and alerts on cost threshold breaches when given user(s) costs across given cluster(s) exceed the specified dollar amounts, budget overruns that occur during the monitoring period (full day).

When cost thresholds are exceeded, alerts are sent immediately when limits are breached with detailed information including total cost amount, individual user cost contributions, and timestamp of when the threshold was exceeded. Notifications are sent via configured channels (email) and delivered to all configured contact groups including primary contacts, secondary contacts, and notification recipients based on the monitoring configuration.
