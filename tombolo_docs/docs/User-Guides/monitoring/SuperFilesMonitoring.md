---
sidebar_position: 4
label: "Superfiles Monitoring"
title: "Superfiles Monitoring"
---

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
