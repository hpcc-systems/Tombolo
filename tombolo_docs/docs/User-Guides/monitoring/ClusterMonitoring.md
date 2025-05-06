---
sidebar_position: 3
label: "Cluster Monitoring"
title: "Cluster Monitoring"
---

Tombolo currently offers only one kind of monitoring for clusters, which is the ability to monitor if the engine(s) specified inside of the cluster exceed a usage percentage target.

1. Engine - Specify the engine(s) inside of the cluster that you'd like to monitor.
2. Cron - The schedule by which tombolo will run the monitoring to check the user provided parameters.
3. Notify When - A list of monitoring paramters that are available, a notification will be sent out if the paramter is set and detected.

   a. Exceeded cluster usage % - A Percentage usage threshold that will trigger a notification to be sent if it is exceeded.<br/>

4. Notification Channel - this allows users to provide a set of MS Teams webhooks and/or emails that will be notified when the user provided parameters are met.
