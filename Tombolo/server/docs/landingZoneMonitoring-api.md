# Landing Zone Monitoring API Documentation

This document describes the REST API endpoints for managing Landing Zone Monitoring configurations.

## Base URL

```
/api/landingZoneMonitoring
```

## Endpoints

### 1. Create Landing Zone Monitoring

**POST** `/api/landingZoneMonitoring`

Creates a new landing zone monitoring configuration.

#### Request Body

```json
{
  "applicationId": "uuid",
  "monitoringName": "string (3-255 chars)",
  "lzMonitoringType": "fileCount|spaceUsage|fileMovement",
  "description": "string (min 10 chars)",
  "clusterId": "uuid",
  "metaData": {
    "threshold": "number",
    "alertEmail": "string",
    "path": "string",
    "frequency": "string"
  },
  "createdBy": "uuid",
  "lastUpdatedBy": "uuid"
}
```

#### Example Request

```json
{
  "applicationId": "123e4567-e89b-12d3-a456-426614174000",
  "monitoringName": "Production File Count Monitor",
  "lzMonitoringType": "fileCount",
  "description": "Monitors file count thresholds in production landing zone",
  "clusterId": "987fcdeb-51a2-43e1-b456-789012345678",
  "metaData": {
    "threshold": 1000,
    "alertEmail": "admin@company.com",
    "path": "/data/landing/prod",
    "frequency": "hourly"
  },
  "createdBy": "456e7890-e12b-34d5-a678-901234567890",
  "lastUpdatedBy": "456e7890-e12b-34d5-a678-901234567890"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "message": "Landing zone monitoring created successfully",
  "data": {
    "id": "789e0123-e45f-67g8-h901-234567890123",
    "applicationId": "123e4567-e89b-12d3-a456-426614174000",
    "monitoringName": "Production File Count Monitor",
    "lzMonitoringType": "fileCount",
    "description": "Monitors file count thresholds in production landing zone",
    "clusterId": "987fcdeb-51a2-43e1-b456-789012345678",
    "metaData": {
      "threshold": 1000,
      "alertEmail": "admin@company.com",
      "path": "/data/landing/prod",
      "frequency": "hourly"
    },
    "approvalStatus": "Pending",
    "createdBy": "456e7890-e12b-34d5-a678-901234567890",
    "lastUpdatedBy": "456e7890-e12b-34d5-a678-901234567890",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Landing Zone Monitorings

**GET** `/api/landingZoneMonitoring/all/:applicationId`

Retrieves all landing zone monitoring configurations for a specific application.

#### Parameters

- `applicationId` (URL parameter): UUID of the application

#### Example Request

```
GET /api/landingZoneMonitoring/all/123e4567-e89b-12d3-a456-426614174000
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "789e0123-e45f-67g8-h901-234567890123",
      "applicationId": "123e4567-e89b-12d3-a456-426614174000",
      "monitoringName": "Production File Count Monitor",
      "lzMonitoringType": "fileCount",
      "description": "Monitors file count thresholds in production landing zone",
      "clusterId": "987fcdeb-51a2-43e1-b456-789012345678",
      "metaData": {
        "threshold": 1000,
        "alertEmail": "admin@company.com",
        "path": "/data/landing/prod",
        "frequency": "hourly"
      },
      "approvalStatus": "Approved",
      "createdBy": "456e7890-e12b-34d5-a678-901234567890",
      "lastUpdatedBy": "456e7890-e12b-34d5-a678-901234567890",
      "approvedBy": "111e2222-e33b-44d5-a666-777888999000",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "approvedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. Get Single Landing Zone Monitoring

**GET** `/api/landingZoneMonitoring/:id`

Retrieves a specific landing zone monitoring configuration by ID.

#### Parameters

- `id` (URL parameter): UUID of the landing zone monitoring

#### Example Request

```
GET /api/landingZoneMonitoring/789e0123-e45f-67g8-h901-234567890123
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "789e0123-e45f-67g8-h901-234567890123",
    "applicationId": "123e4567-e89b-12d3-a456-426614174000",
    "monitoringName": "Production File Count Monitor",
    "lzMonitoringType": "fileCount",
    "description": "Monitors file count thresholds in production landing zone",
    "clusterId": "987fcdeb-51a2-43e1-b456-789012345678",
    "metaData": {
      "threshold": 1000,
      "alertEmail": "admin@company.com",
      "path": "/data/landing/prod",
      "frequency": "hourly"
    },
    "approvalStatus": "Pending",
    "createdBy": "456e7890-e12b-34d5-a678-901234567890",
    "lastUpdatedBy": "456e7890-e12b-34d5-a678-901234567890",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Landing Zone Monitoring

**PATCH** `/api/landingZoneMonitoring`

Updates an existing landing zone monitoring configuration.

#### Request Body

```json
{
  "id": "uuid (required)",
  "applicationId": "uuid (optional)",
  "monitoringName": "string (optional)",
  "lzMonitoringType": "fileCount|spaceUsage|fileMovement (optional)",
  "description": "string (optional)",
  "clusterId": "uuid (optional)",
  "metaData": "object (optional)",
  "lastUpdatedBy": "uuid (required)"
}
```

#### Example Request

```json
{
  "id": "789e0123-e45f-67g8-h901-234567890123",
  "monitoringName": "Updated Production File Count Monitor",
  "description": "Updated monitoring configuration with new thresholds",
  "metaData": {
    "threshold": 1500,
    "alertEmail": "admin@company.com",
    "path": "/data/landing/prod",
    "frequency": "every-30-minutes"
  },
  "lastUpdatedBy": "456e7890-e12b-34d5-a678-901234567890"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Landing zone monitoring updated successfully",
  "data": {
    "id": "789e0123-e45f-67g8-h901-234567890123",
    "applicationId": "123e4567-e89b-12d3-a456-426614174000",
    "monitoringName": "Updated Production File Count Monitor",
    "lzMonitoringType": "fileCount",
    "description": "Updated monitoring configuration with new thresholds",
    "clusterId": "987fcdeb-51a2-43e1-b456-789012345678",
    "metaData": {
      "threshold": 1500,
      "alertEmail": "admin@company.com",
      "path": "/data/landing/prod",
      "frequency": "every-30-minutes"
    },
    "approvalStatus": "Pending",
    "createdBy": "456e7890-e12b-34d5-a678-901234567890",
    "lastUpdatedBy": "456e7890-e12b-34d5-a678-901234567890",
    "approvedBy": null,
    "approverComment": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:15:00.000Z",
    "approvedAt": null
  }
}
```

### 5. Delete Landing Zone Monitoring

**DELETE** `/api/landingZoneMonitoring/:id`

Soft deletes a landing zone monitoring configuration.

#### Parameters

- `id` (URL parameter): UUID of the landing zone monitoring to delete

#### Example Request

```
DELETE /api/landingZoneMonitoring/789e0123-e45f-67g8-h901-234567890123
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Landing zone monitoring deleted successfully"
}
```

## Additional Endpoints

### 6. Get Dropzones for Cluster

**GET** `/api/landingZoneMonitoring/getDropzones?clusterId=uuid`

Retrieves available dropzones for a specific cluster.

#### Example Request

```
GET /api/landingZoneMonitoring/getDropzones?clusterId=987fcdeb-51a2-43e1-b456-789012345678
```

### 7. Get File List

**GET** `/api/landingZoneMonitoring/fileList?clusterId=uuid&DropZoneName=string&Netaddr=string&Path=string&DirectoryOnly=boolean`

Retrieves file listing from a specific dropzone path.

#### Example Request

```
GET /api/landingZoneMonitoring/fileList?clusterId=987fcdeb-51a2-43e1-b456-789012345678&DropZoneName=mydropzone&Netaddr=192.168.1.100&Path=/data&DirectoryOnly=false
```

## Error Responses

### Validation Error (400/422)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Application ID must be a valid UUID",
    "Monitoring name is required"
  ]
}
```

### Not Found (404)

```json
{
  "success": false,
  "message": "Landing zone monitoring not found"
}
```

### Conflict (409)

```json
{
  "success": false,
  "message": "A landing zone monitoring with this name already exists"
}
```

### Server Error (500)

```json
{
  "success": false,
  "message": "Failed to create landing zone monitoring"
}
```

## Field Descriptions

### Core Fields

- `id`: Unique identifier (UUID)
- `applicationId`: Reference to the application (UUID)
- `monitoringName`: Name of the monitoring configuration (3-255 characters)
- `lzMonitoringType`: Type of monitoring (fileCount, spaceUsage, fileMovement)
- `description`: Detailed description (minimum 10 characters)
- `clusterId`: Reference to the cluster (UUID)
- `metaData`: JSON object containing monitoring-specific configuration

### Approval Workflow Fields

- `approvalStatus`: Current approval status (Pending, Approved, Rejected)
- `approverComment`: Comment from approver
- `approvedBy`: UUID of user who approved/rejected
- `approvedAt`: Timestamp of approval/rejection

### Audit Fields

- `createdBy`: UUID of user who created the record
- `lastUpdatedBy`: UUID of user who last updated the record
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `deletedAt`: Soft deletion timestamp (null if not deleted)

## Notes

1. All create and update operations reset the approval status to "Pending"
2. The API uses soft deletion (paranoid mode) - deleted records are not permanently removed
3. All UUID fields are validated for proper format
4. Foreign key constraints ensure data integrity
5. Comprehensive error handling provides specific error messages for different failure scenarios
