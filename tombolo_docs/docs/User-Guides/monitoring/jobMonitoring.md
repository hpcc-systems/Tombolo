---
sidebar_position: 1
label: "Job Monitoring"
title: "Job Monitoring"
---

Job monitoring in Tombolo allows you to track **Work Units (WU)** running on HPCC clusters. Tombolo checks the clusters every 30 minutes and monitors work units based on a specified name or name pattern. It can send notifications if a work unit enters an undesired state, deviates from the expected state, or violates punctuality rules, such as failing to start or complete within the expected time.

Tombolo allows you to monitor various states of a work unit to ensure jobs run as expected and to alert you if issues arise. Below are the states that can be monitored:

**Job Did Not Start on Expected Time** If a job is scheduled to run at a specific time but fails to start, Tombolo will alert you to ensure that the delay is addressed promptly.

**Job Did Not Complete on Time** Tombolo monitors jobs to ensure they complete within the expected timeframe. If a job exceeds the expected completion time, a notification will be sent to inform you of the delay.

**Failed** If a work unit encounters an error or fails for any reason during execution, Tombolo will notify you so you can take appropriate action to resolve the issue.

**Aborted** If a job is manually or automatically aborted, Tombolo will send a notification, allowing you to investigate why the job was stopped prematurely.

**Unknown** When a work unit enters an unknown state, Tombolo will notify you to investigate further.

---

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Setting Up Job Monitoring
</summary>

To set up job monitoring in Tombolo, follow these steps. After creating the monitoring, it must be approved and activated for the monitoring to take effect.

1. Access the **Monitoring** menu from the left vertical bar and select **Job**.
2. This will navigate you to the Job Monitoring page.
3. On the top-right corner, click the **Action** button and select **Add Job Monitoring**.
4. A modal with three tabs will appear. Complete the required details in each tab. Alternatively, if you have an existing monitoring setup, you can quickly create a new one by duplicating it and modifying the necessary details. To duplicate, click on 'More' under the Actions menu in the Job Monitoring table.

### **Tab 1: Basic Information**

This tab collects essential details about the job monitoring setup:

1. **Monitoring Name** Provide a unique name for this job monitoring configuration. The name must be distinct across all job monitorings.

2. **Description** Enter a brief description to make it easier to understand the purpose of this monitoring.

3. **Monitoring Scope** Choose one of the two options:
   Select 'Specific Job' if you know the job name and it is always the same. Select 'Monitoring by Job Pattern' if the job name changes but follows a consistent pattern.
4. **Cluster**  
   Select a predefined cluster where the job is expected to run.

5. **Job Name / Job Name Pattern**  
   If the job name is constant, enter the exact name. If not, provide a pattern for the job name. Click the information icon next to this field for details on acceptable patterns.

---

### **Tab 2: Scheduling Information**

This tab is used to define the job schedule and timing requirements.

1. **Schedule** Use the schedule picker at the top to define when the monitoring should occur.

2. **Require Complete** Toggle this to **Yes** if the job is expected to complete at a specific time.

3. **Expected Start Time** Specify the time when the job is expected to start. If there is no specific expected start time, enter the same value as the expected completion time.

4. **Expected Completion Time** Specify the time by which the job is expected to complete.

Depending on enabled integrations, additional fields may appear in this tab.

---

### **Tab 3: Notifications**

This tab configures how and when notifications are sent:

1. **Notify When** Choose the conditions under which a notification should be sent (e.g., job state or timing violations).

2. **Primary Contact** Specify the primary recipient for this job monitoring configuration.

_Depending on enabled integrations, additional fields may appear in this tab_

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Updating Job Monitoring
</summary>

To update existing job monitoring, you can use the **Edit** or **Bulk Edit** options:

1. **Edit Option**  
   For individual Job Monitoring, the **Edit** option is available under **Actions** in the Job Monitoring table. This allows you to update all the fields for a specific job monitoring.

2. **Bulk Edit Option**  
 The **Bulk Edit** option, accessible via the **Action** button in the top-right corner, enables you to update multiple job monitorings simultaneously. This is useful for making changes to several monitorings at once; however, note that only a limited set of fields can be updated using this option.
</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Pausing and Starting Job Monitoring
</summary>
 Job monitoring can be started or paused as needed. To do so, use the **Start/Pause** icon under the **Actions** menu in the Job Monitoring table.
</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Notifications
</summary>
Job Monitoring sends notifications when the specified conditions are met. These notifications are saved by Tombolo and can be accessed from the Notifications page. To view the notifications, expand the dashboard and click on **Notifications** in the left navigation menu.
</details>
</div>
