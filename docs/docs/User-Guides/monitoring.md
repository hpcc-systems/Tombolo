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

There is one setting that is common to all monitorings.

1. Name - This is a title that can be used for quick reference for any user that has access to the monitorings and access. This must be unique to all other monitorings of that type.

## File

Currently on offer is the ability to monitor both [Logical Files](#logical-files) and [Landing Zone Files](#landing-zone-files). There are a few settings available to both types of file monitoring.

1. Notification Channel - this allows users to provide a set of MS Teams webhooks and/or emails that will be notified when the user provided parameters are met.
2. Cron - The schedule by which tombolo will run the monitoring to check the user provided parameters.
3. Cluster - The selected cluster that will be monitored for the user provided paramters.

### Logical Files

Logical Files are files stored inside of the HPCC cluster after a spray job has been run on them. For logical files, Tombolo offers the following monitoring paramters

1. File - This can be a singular file

### Landing Zone Files

## Clusters

## Jobs

## Superfiles
