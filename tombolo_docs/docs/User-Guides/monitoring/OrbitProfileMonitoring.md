---
id: OrbitProfileMonitoring
title: Orbit Profile Monitoring
---

**Orbit Profile Monitoring** is a feature in Tombolo that evaluates Orbit build artifacts (from the Orbit reports database) against configured expectations for build status and update cadence. Monitors are stored as `OrbitMonitoring` records and executed on a configurable schedule (default: every 30 minutes). The monitor collects recent workunit records, evaluates configured rules, and records any violations.

---

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Monitoring Types and Frequency
</summary>

**Frequency:**

Monitors are configured to run every 30 minutes by default but the schedule is configurable per-monitor. For testing you may schedule more frequent runs; in production typical schedules are daily or hourly depending on business needs.

**Monitoring Types:**

- **Build Status Monitoring** — detect configured build statuses (e.g., `production`, `passed_qa`).
- **Update Schedule Monitoring** — ensure the build is updated on the expected cadence (`updateInterval`) and allowed weekdays (`updateIntervalDays`).

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Setting Up an Orbit Profile Monitor
</summary>

1. Open the **Monitoring** menu and select **Orbit Profile Monitoring**.
2. Click **Add Orbit Monitoring** and complete the modal tabs.
3. Save the monitor (it will be in **Pending** state until approved).

### Tab: Basic Information

- **Monitoring Name** — friendly name.
- **Description** — optional.
- **Build Name** — Orbit build identifier used in the reports DB queries.

### Tab: Monitoring Details

- **Notification Conditions** — choose `Build not following correct interval` and/or `Build status`.
- **Update Interval (days)** — shown when interval condition is selected.
- **Update Interval Days** — allowed weekdays for updates.
- **Build Status** — selectable list of normalized status tokens shown when build status is selected.

### Tab: Notifications

- **Primary / Secondary / Notify Contacts** — recipient groups when notifications are enabled.
- **Cron** — schedule for this monitor (default: every 30 minutes).

After approval, activate the monitor using the power toggle.

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Managing Monitors
</summary>

Available actions:

- **View** — see configuration and recent detections.
- **Edit** — modify settings (may require re-approval).
- **Approve / Reject** — administrative review for pending monitors.
- **Pause / Start** — toggle activation.
- **Duplicate** — copy settings.
- **Delete** — remove monitor and unschedule the monitor.

</details>
</div>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Backend process
</summary>

When a monitor is executed it performs:

1. Load monitor record and read `metaData.monitoringData`.
2. Query `DimBuildInstance` for recent workunit records for the configured build name.
3. Normalize `Status` strings and evaluate `buildStatus` rule when enabled.
4. Compute day differences and evaluate `updateInterval` and `updateIntervalDays` rules when enabled.
5. Record detections in `metaDifference` and update `metaData.lastMonitored`.

Notification delivery (email/MS Teams) is handled separately and can use the detection details written by the worker.

</details>
</div>
