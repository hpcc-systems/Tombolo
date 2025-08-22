---
sidebar_position: 3
label: "Cluster Monitoring"
title: "Cluster Monitoring"
---

# Cluster Monitoring

Cluster Monitoring in Tombolo helps you automatically track the health of your HPCC clusters. It regularly checks the status of cluster engines and sends notifications if any issues are found, so you can quickly respond and keep your systems running smoothly.

---

## What Does Cluster Monitoring Do?

- **Monitors Cluster Engines**: Tombolo checks the status of key cluster engines—Thor, Roxie, and HThor—on each cluster you select.
- **Detects Problems**: If any engine is not in the "Active" state (for example, if it is down or paused), Tombolo will consider this a problem.
- **Sends Alerts**: When a problem is detected, Tombolo sends a notification to your chosen contacts with details about the issue.

---

## How Does Cluster Monitoring Work?

1. **Setup**: You create a cluster monitoring configuration in Tombolo, specifying which cluster to monitor and who should be notified.
2. **Automatic Checks**: Tombolo runs checks at regular intervals (default: every 10 minutes). It connects to each cluster and asks for the status of all engines.
3. **Problem Detection**: Tombolo looks at the status of each engine. If any engine is not "Active", it marks that cluster as problematic.
4. **Notification**: For each problematic cluster, Tombolo sends an email (and optionally other notifications) to the contacts you provided. The notification includes:
   - The name of the cluster
   - Which engines are not active
   - A description of the issue
   - The time the problem was detected

---

## Setting Up Cluster Monitoring

To set up cluster monitoring in Tombolo:

1. Go to the **Monitoring** menu and select **Cluster**.
2. Click the **Action** button and choose **Add Cluster Monitoring**.
3. Fill out the form:

   - **Monitoring Name**: Enter a unique name for this monitoring setup.
   - **Description**: Add a brief description to help you remember the purpose of this monitoring.
   - **Cluster**: Select the cluster you want to monitor.
   - **Notification Contacts**: Enter the email addresses of the main people who should receive alerts. You can also add secondary contacts or MS Teams webhooks.
   - (If enabled) **Domain/Product Category**: For organizations using ASR integrations, you can specify domain and product category for more targeted notifications.

4. Save and submit your monitoring configuration. It must be approved before it becomes active.

---

## What Happens After Setup?

- Tombolo will automatically check your clusters at the interval.
- If any engine is not "Active", Tombolo will send notifications to your chosen contacts.
- Notifications include all relevant details so you can quickly identify and resolve the issue.

---

## Example Notification

> **Subject:** Cluster Monitoring Alert: Cluster "FinanceCluster" has 2 engines in non-active state  
> **Details:**
>
> - Cluster: FinanceCluster
> - Problematic Engines: Thor (Paused), Roxie (Down)
> - Detected at: 2025-08-21 10:15 AM
> - Description: FinanceCluster has 2 cluster(s) in non-active state.

---

## Managing Cluster Monitoring

- **Edit**: You can update all fields for a specific cluster monitoring by clicking **Edit** in the Actions menu.
- **Bulk Edit**: You can update multiple cluster monitorings at once.
- **View Details**: Click on a monitoring entry to see its current status and history of alerts.

---

## Why Use Cluster Monitoring?

Cluster Monitoring helps you:

- Detect problems early, before they impact your work
- Respond quickly to outages or engine failures
- Keep your clusters running smoothly with minimal manual effort

---
