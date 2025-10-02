---
sidebar_position: 2
label: "File Monitoring"
title: "File Monitoring"
---

File monitoring in Tombolo allows you to track **logical files** (standard or super files) on HPCC clusters. Tombolo checks the clusters at regular intervals and monitors files based on a specified name or pattern. It can send notifications if a file is outside the expected size range, or (for super files) if the subfile count is not within the expected range.

Below are the main monitoring capabilities:

**File Size Not in Range**
For standard logical files and super files, Tombolo checks if the file size is within the expected minimum and maximum values. If not, a notification is sent.

**Super File Subfile Count Not in Range**
For super files, Tombolo also checks the number of subfiles. If the count is outside the specified range, you will be notified.

---

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Setting Up File Monitoring
</summary>

To set up file monitoring in Tombolo, follow these steps. After creating the monitoring, it must be approved and activated for the monitoring to take effect.

1. Access the **Monitoring** menu from the left vertical bar and select **File**.
2. This will navigate you to the File Monitoring page.
3. On the top-right corner, click the **Action** button and select **Add File Monitoring**.
4. A modal with two tabs will appear. Complete the required details in each tab. Alternatively, you can duplicate an existing monitoring by clicking 'More' under the Actions menu in the File Monitoring table.

### **Tab 1: Basic Information**

This tab collects essential details about the file monitoring setup:

1. **Monitoring Name**  
   Provide a unique name for this file monitoring configuration. The name must be distinct across all file monitorings.
2. **Description**  
   Enter a brief description to clarify the purpose of this monitoring.
3. **Cluster**  
   Select the HPCC cluster where the file(s) are located.
4. **File Type**  
   Choose between:
   - **Standard Logical File**: Monitors a single logical file.
   - **Super File**: Monitors a super file and its subfiles.
5. **File Name or Pattern**  
   Enter the exact name or a pattern (wildcard) for the logical file or super file to monitor.

---

### **Tab 2: Notifications**

This tab configures how and when notifications are sent:

1. **Notify When**  
   Choose the conditions under which a notification should be sent:
   - For standard logical files: "File size not in range".
   - For super files: "Subfile count not in range" and/or "Total size not in range".
2. **Minimum/Maximum File Size**  
   Specify the expected size range for the file (with selectable units: MB, GB, TB, PB).
3. **Minimum/Maximum Subfile Count**  
   (For super files) Specify the expected range for the number of subfiles.
4. **Primary Contact(s)**  
   Specify the primary recipient(s) for this file monitoring configuration.

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Updating File Monitoring
</summary>

To update existing file monitoring, you can use the **Edit** or **Bulk Edit** options:

1. **Edit Option**  
   For individual File Monitoring, the **Edit** option is available under **Actions** in the File Monitoring table. This allows you to update all the fields for a specific file monitoring.
2. **Bulk Edit Option**  
 The **Bulk Edit** option, accessible via the **Action** button in the top-right corner, enables you to update multiple file monitorings simultaneously. Only a limited set of fields can be updated using this option.
</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Approval Process
</summary>
When a new file monitoring configuration is created, it starts in a **pending** state. An authorized user must approve the monitoring before it becomes eligible to be activated.  The approval status can be **pending**, **approved**, or **rejected**, and approvers can leave comments.
</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Pausing and Starting File Monitoring
</summary>
File monitoring can be started or paused as needed, but the monitoring must be in the **approved** state before it can be toggled. To start or pause monitoring, use the **Start/Pause** icon under the **Actions** menu in the File Monitoring table.
</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Notifications
</summary>
File Monitoring sends notifications when the specified conditions are met. These notifications are saved by Tombolo and can be accessed from the Notifications page. To view the notifications, expand the dashboard and click on **Notifications** in the left navigation menu.
</details>
</div>
