---
sidebar_position: 4
label: "Monitoring"
title: "Monitoring"
---

# Monitoring

Tombolo currently offers the ability to monitor 4 different kinds of assets.

1. [Files](#file)
2. [Clusters](#cluster)
3. [Jobs](#job)
4. [Superfiles](#superfile)

There is two settings that is common to all monitorings.

1. Name - This is a title that can be used for quick reference for any user that has access to the monitorings and access. This must be unique to all other monitorings of that type.
2. Cluster - The selected cluster that will be monitored for the user provided paramters.

## File

Currently on offer is the ability to monitor both [Logical Files](#logical-files) and [Landing Zone Files](#landing-zone-files). There are a few settings available to both types of file monitoring.

1. Notification Channel - this allows users to provide a set of MS Teams webhooks and/or emails that will be notified when the user provided parameters are met.
2. Cron - The schedule by which tombolo will run the monitoring to check the user provided parameters.
3. File - This can be a singular file name or use any eligible [wildcards](/docs/User-Guides/Wildcards) to select anything matching a pattern.

### Logical Files

Logical Files are files stored inside of the HPCC cluster after a spray job has been run on them. For logical files, Tombolo offers the following monitoring paramters

1. Notify When - A list of monitoring paramters that are available, a notification will be sent out if the paramter is set and detected.

   a. File Size - When the file exceeds the input size.<br/>
   b. File Size not in range - If the file size exceeds the maximum, or goes below the minimum<br/>
   c. Owner - If the owner of the file changes<br/>
   d. File Type - If the file type changes<br/>
   e. Compressed - If the file has been compressed<br/>
   f. Protecred - If the file has a new protection set for it<br/>
   g. File Deleted - If the file is deleted<br/>

### Landing Zone Files

Landing Zone files are files that have been added to an external landing zone, ready to be sprayed or desprayed into the HPCC cluster.

1. Landing Zone - The Landing zone machine name and IP Address to monitor

2. Directory - The directory of the file or pattern that you would like to monitor

3. Notify When - A list of monitoring paramters that are available, a notification will be sent out if the paramter is set and detected.

   a. File is not moving - Notification is sent out if the file is not moved within the expected file move time from the first time that Tombolo detects the file.<br/>
   b. File is detected - Anytime tombolo matches a file name or pattern within the specified directory and landing zone.<br/>
   c. Incorrect File Size - Anytime a file is detected outside of the specified size range.<br/>

## Clusters

Tombolo currently offers only one kind of monitoring for clusters, which is the ability to monitor if the engine(s) specified inside of the cluster exceed a usage percentage target.

1. Engine - Specify the engine(s) inside of the cluster that you'd like to monitor.
2. Cron - The schedule by which tombolo will run the monitoring to check the user provided parameters.
3. Notify When - A list of monitoring paramters that are available, a notification will be sent out if the paramter is set and detected.

   a. Exceeded cluster usage % - A Percentage usage threshold that will trigger a notification to be sent if it is exceeded.<br/>

4. Notification Channel - this allows users to provide a set of MS Teams webhooks and/or emails that will be notified when the user provided parameters are met.

## Jobs

Jobs are actions run inside of HPCC clusters utilziing sets of ECL code to do things such as clean, transform, and translate data.

1. Description - Used to describe what the monitoring is for future reference.
2. Monitoring Scope

   a. Spefic Job - Monitor one job.<br/>
   b. Monitoring by Job Pattern - Monitor jobs by name using any eligible [wildcards](/docs/User-Guides/Wildcards) to create a pattern.<br/>

3. Schedule - Our new schedule picker for ease of use.

   a. Daily - A list of options available for daily running, or every other day.<br/>
   b. Weekly - The ability to select monitoring during windows of time for certain days of the week.<br/>
   c. Monthly - Select specific days of the month, or specific weeks of the month.<br/>
   d. Yearly - The ability to filter running by month and date or week.<br/>
   e. Cron - Set your own custom cron schedule.<br/>

4. Expected Start Time - 24h Format, Used for the "Not completed on time" option.
5. Expcted Completion Time - 24h Format, Used for the "Not started on time" option.
6. Require Complete - Select whether or not to require the job to be complete.
7. Notify When -

   a. Failed - When the job reports back an failed status<br/>
   b. Aborted - When the job reports back an aborted status<br/>
   c. Uknown - Whent he job reports back an unknown status<br/>
   d. Not started on time - Notifies if the job does not start by the time specified in the "Expected Start Time" field.<br/>
   e. Not completed on time - Notifies if the job does not complete by the time specified in the "Expected Completion Time" field.<br/>

8. Teams Channel - Select which [teams webhook](/docs/User-Guides/teams-webhook) you would like to use for teams channel notifications
9. Primary Contacts - A list of comma seperated email values that will receive email notifications anytime a notification is triggered.

## Superfiles

Superfiles are collections of files inside of an HPCC cluster, and can be thought of as similar to a folder inside of an operating system. Tombolo currently provides a few different monitoring paramters for these collections of files.

1. Search File - This can be a singular superfile name or use any eligible [wildcards](/docs/User-Guides/Wildcards) to select anything matching a pattern.
2. Cron - The schedule by which tombolo will run the monitoring to check the user provided parameters.
3. Notify When -

   a. File Size Changes - When the size of the superfile, which is the sum of the size of all of the logical files inside of it, changes from the last detected value.<br/>
   b. Total size not in range - When the size of the superfile is not in the specified range<br/>
   c. Subfile count changes - When the number of files within the superfile changes<br/>
   d. Subfile count not in range - When the number of files within the superfile is not in range<br/>
   e. Update interval not followed - When the file doesn't recieve an update during the specified interval from it's last detected update.<br/>
   f. File deleted - When the superfile is deleted<br/>

4. Notification Channel - this allows users to provide a set of MS Teams webhooks and/or emails that will be notified when the user provided parameters are met.
