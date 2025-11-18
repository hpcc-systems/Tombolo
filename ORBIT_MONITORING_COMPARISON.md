# Old Orbit Monitoring System - Technical Deep Dive

This document provides a detailed technical analysis of the legacy Orbit Monitoring system created around 2023, focusing on its database connections, SQL operations, and monitoring logic.

## System Overview

### Core Purpose
The Old Orbit Monitoring system was a sophisticated build lifecycle monitoring tool for **LexisNexis Insurance domain builds**. It connected to external databases to track build statuses and send automated notifications when builds deviated from expected patterns.

## Database Connections & Architecture

### Primary Database: Orbit Reports MySQL Database
The system connects to an external **Orbit Reports database** using MySQL connection configuration stored in `orbitDbConfig`. This is a separate database from Tombolo's main PostgreSQL database.

### Local Tombolo Database
Additionally maintains its own records in Tombolo's PostgreSQL database in the `orbit_monitorings` table.

## Database Schema - `orbit_monitorings` Table

```sql
CREATE TABLE orbit_monitorings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  cron VARCHAR NOT NULL,                    -- Cron expression for scheduling
  isActive BOOLEAN DEFAULT false,
  build VARCHAR NOT NULL,                   -- Build name to monitor
  severityCode TINYINT DEFAULT 0,
  businessUnit VARCHAR NOT NULL,
  product VARCHAR NOT NULL,
  host VARCHAR NOT NULL,
  primaryContact VARCHAR,
  secondaryContact VARCHAR,
  metaData JSON,                           -- Complex monitoring conditions
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP                      -- Soft delete support
);
```

### MetaData Structure
The `metaData` JSON field contains:
- **lastWorkUnit**: Latest work unit information from Orbit
- **notifications**: Email and Teams notification configurations
- **monitoringCondition**: Complex monitoring rules and conditions
- **severityCode**: Alert severity levels

## SQL Queries & External Database Operations

### 1. Build Search Query
**File**: `routes/orbit/read.js` - Search endpoint
```sql
SELECT Name 
FROM DimBuildInstance 
WHERE Name LIKE '%keyword%' 
  AND Name NOT LIKE 'Scrub%' 
  AND EnvironmentName = 'Insurance' 
ORDER BY Name ASC
```
**Purpose**: Provides autocomplete functionality for build selection in the UI.

### 2. Build Details Query
**File**: `routes/orbit/read.js` - Get single build details
```sql
SELECT EnvironmentName, Name, Status_DateCreated, HpccWorkUnit, 
       Status_Code, Substatus_Code, BuildInstanceIdKey  
FROM DimBuildInstance 
WHERE Name = '${buildName}' 
ORDER BY Status_DateCreated DESC 
LIMIT 1
```
**Purpose**: Fetches current status and metadata for a specific build.

### 3. Latest Work Unit Query (Create/Update)
**File**: `routes/orbit/read.js` - Create/Update operations
```sql
SELECT HpccWorkUnit as 'WorkUnit', Name as 'Build', 
       DateUpdated as 'Date', Status_Code as 'Status' 
FROM DimBuildInstance 
WHERE Name = '${buildName}' 
ORDER BY Date DESC 
LIMIT 1
```
**Purpose**: Gets the most recent work unit for storing baseline comparison data.

### 4. Monitoring Job Query
**File**: `jobs/submitOrbitMonitoring.js` - Background monitoring job
```sql
SELECT HpccWorkUnit as 'WorkUnit', Name as 'Build', 
       DateUpdated as 'Date', Status_Code as 'Status', 
       Version, BuildTemplateIdKey as 'BuildID'  
FROM DimBuildInstance 
WHERE Name = '${build}' 
  AND HpccWorkUnit IS NOT NULL 
ORDER BY Date DESC 
LIMIT 10
```
**Purpose**: Fetches recent build history for comparison and change detection.

## Background Job System

### Job Scheduler Integration
Uses **Bree job scheduler** with cron expressions to run periodic checks:

```javascript
// Job creation in job-scheduler.js
createOrbitMonitoringJob({ orbitMonitoring_id, cron }) {
  return createOrbitMonitoringJob.call(this, { orbitMonitoring_id, cron });
}
```

### Monitoring Logic (`submitOrbitMonitoring.js`)

The background job performs several monitoring checks:

#### 1. Build Status Monitoring
```javascript
if (notifyCondition.includes('buildStatus')) {
  let newStatus = wuResult[0][0].Status.toLowerCase();
  
  if (monitoringCondition?.buildStatus.includes(newStatus)) {
    metaDifference.push({
      attribute: 'Build Status',
      oldValue: orbitMonitoringDetails.metaData.lastWorkUnit.lastWorkUnitStatus,
      newValue: newStatus,
    });
  }
}
```

#### 2. Update Interval Monitoring
```javascript
if (notifyCondition.includes('updateInterval') || 
    notifyCondition.includes('updateIntervalDays')) {
  
  let updateInterval = monitoringCondition?.updateInterval;
  let updateIntervalDays = monitoringCondition?.updateIntervalDays;
  
  const lastDate = new Date(modified);
  const newDate = new Date(newModified);
  const diffInMilliseconds = Math.abs(newDate - lastDate);
  const diffDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));
  
  // Check if build is overdue or not following schedule
}
```

## API Endpoints

### Core CRUD Operations
- **POST** `/api/orbit/` - Create new monitoring
- **PUT** `/api/orbit/` - Update existing monitoring  
- **DELETE** `/api/orbit/delete/:id/:name` - Delete monitoring
- **GET** `/api/orbit/allMonitorings/:application_id` - Get all for app

### Monitoring Control
- **PUT** `/api/orbit/togglestatus/:id` - Start/pause monitoring
- **GET** `/api/orbit/getOne/:application_id/:id` - Get single monitoring

### Build Discovery
- **GET** `/api/orbit/search/:application_id/:keyword` - Search builds
- **GET** `/api/orbit/getOrbitBuildDetails/:buildName` - Get build info

### Domain Data
- **GET** `/api/orbit/getProducts/:application_id` - Get product list
- **GET** `/api/orbit/getDomains/:application_id` - Get business units

## Notification System

### Multi-Channel Notifications
Supports both email and Microsoft Teams notifications:

```javascript
// Notification configuration in metaData
notifications = [
  { channel: 'eMail', recipients: ['user@example.com'] },
  { channel: 'msTeams', recipients: ['team-webhook-url'] }
];
```

### Notification Triggers
- **Build Status Changes**: When build reaches specified status
- **Schedule Violations**: When build doesn't follow expected update pattern
- **Overdue Builds**: When build hasn't been updated within expected timeframe
- **Day-of-Week Violations**: When build updates on unexpected days

## Job Lifecycle Management

### Dynamic Job Control
```javascript
// Start monitoring
if (isActive && oldInfo.isActive === 0) {
  const schedularOptions = {
    orbitMonitoring_id: id,
    cron: newOrbitMonitoring.cron,
  };
  jobScheduler.createOrbitMonitoringJob(schedularOptions);
}

// Stop monitoring  
if (!isActive && oldInfo.isActive === 1) {
  await jobScheduler.removeJobFromScheduler(`Orbit Monitoring - ${id}`);
}

// Update cron schedule
if (oldInfo.cron != cron) {
  await jobScheduler.removeJobFromScheduler(`Orbit Monitoring - ${id}`);
  await jobScheduler.createOrbitMonitoringJob({
    orbitMonitoring_id: id,
    cron: cron,
  });
}
```

## Data Flow Summary

1. **User creates monitoring** → Queries Orbit DB for latest build info → Stores baseline in `metaData`
2. **Cron job triggers** → Queries Orbit DB for current status → Compares with stored baseline
3. **Changes detected** → Generates notifications → Updates baseline data
4. **User modifies monitoring** → Updates cron schedule → Restarts background job

The system essentially acts as a **bridge between Tombolo and the external LexisNexis Orbit Reports database**, providing automated monitoring and alerting for critical insurance build processes.

## File Structure

```
server/
├── routes/orbit/read.js                     # Main API endpoints
├── jobs/submitOrbitMonitoring.js            # Background job processor
├── models/OrbitMonitoring.js                # Database model
├── migrations/20230906000000-create-OrbitMonitoring.js
└── jobSchedular/job-scheduler.js            # Cron job management

client-reactjs/src/components/application/orbitMonitoring/
├── OrbitMonitoring.jsx                      # Main component (commented out)
├── OrbitMonitoringModal.jsx                 # Form modal
├── OrbitMonitoringTable.jsx                 # Data table
├── BasicTab.jsx                             # Basic information form
├── MonitoringTab.jsx                        # Monitoring settings
└── NotificationsTab.jsx                     # Notification configuration
```

## What It Actually Monitored
1. **Build Status Changes**: When LexisNexis insurance builds succeeded, failed, or changed status
2. **Update Schedules**: Whether builds were updated according to expected intervals
3. **Work Unit Tracking**: Monitored HPCC work units associated with builds
4. **Schedule Compliance**: Ensured builds updated on correct days/intervals
5. **Build Availability**: Tracked when builds became available or unavailable

## Additional Technical Details

### External Database Connection
The system uses a dedicated MySQL connection to the **Orbit Reports database**, completely separate from Tombolo's main PostgreSQL database. Connection details are stored in `orbitDbConfig`.

### DimBuildInstance Table Structure
The external table being queried has these key fields:
- `Name`: Build identifier
- `EnvironmentName`: Usually 'Insurance'  
- `Status_Code`: Current build status
- `Substatus_Code`: Additional status information
- `HpccWorkUnit`: Associated HPCC work unit ID
- `Status_DateCreated`: When status was last updated
- `DateUpdated`: Build last modified date
- `Version`: Build version information
- `BuildTemplateIdKey`: Template reference

### Cron Expression Usage
Each monitoring record includes a cron expression that determines when the background job runs:
```javascript
// Example cron patterns used:
"0 0 * * *"     // Daily at midnight
"0 */6 * * *"   // Every 6 hours  
"0 8 * * 1-5"   // Weekdays at 8am
```

### Notification Message Templates
The system uses rich message card templates for notifications:
- **Email**: HTML templates with build status details
- **Teams**: Adaptive cards with action buttons
- **Content**: Build name, status changes, work unit info, links to Tombolo

The old system essentially functions as a **dedicated bridge service** between Tombolo and LexisNexis's internal Orbit build reporting infrastructure, providing automated monitoring and alerting for critical insurance domain build processes.