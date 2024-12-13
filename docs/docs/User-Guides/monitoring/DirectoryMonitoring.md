---
sidebar_position: 2
label: "Directory Monitoring"
title: "Directory Monitoring"
---

Directory monitoring in Tombolo enables tracking of files within the HPCC cluster, covering both [Logical Files](#logical-files) and [Landing Zone Files](#landing-zone-files). For logical files, you can monitor attributes like size, type, compression status, deletion, and protection status. For landing zone files, you can track file movement, appearance, and sizes, ensuring efficient management and visibility of your data

1. Notification Channel - this allows users to provide a set of MS Teams webhooks and/or emails that will be notified when the user provided parameters are met.
2. Cron - The schedule by which tombolo will run the monitoring to check the user provided parameters.
3. File - This can be a singular file name or use any eligible [wildcards](/docs/User-Guides/Wildcards) to select anything matching a pattern.

---

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

---

### Landing Zone Files

Landing Zone files are files that have been added to an external landing zone, ready to be sprayed or desprayed into the HPCC cluster.

1. Landing Zone - The Landing zone machine name and IP Address to monitor

2. Directory - The directory of the file or pattern that you would like to monitor

3. Notify When - A list of monitoring paramters that are available, a notification will be sent out if the paramter is set and detected.

   a. File is not moving - Notification is sent out if the file is not moved within the expected file move time from the first time that Tombolo detects the file.<br/>
   b. File is detected - Anytime tombolo matches a file name or pattern within the specified directory and landing zone.<br/>
   c. Incorrect File Size - Anytime a file is detected outside of the specified size range.<br/>
