const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const testingPassword = 'Password123!';

function getUsers() {
  return [
    {
      id: uuidv4(),
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe121@example.com',
      hash: bcrypt.hashSync(testingPassword, 10),
      registrationMethod: 'traditional',
      verifiedUser: true,
      registrationStatus: 'active',
      forcePasswordReset: false,
      accountLocked: {
        isLocked: false,
      },
      metaData: {
        previousPassword: [],
      },
    },
    {
      id: uuidv4(),
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe122@example.com',
      hash: bcrypt.hashSync(testingPassword, 10),
      registrationMethod: 'traditional',
      verifiedUser: true,
      registrationStatus: 'active',
      forcePasswordReset: false,
      accountLocked: {
        isLocked: false,
      },
      metaData: {
        previousPassword: [],
      },
    },
  ];
}

function getInstanceSettings() {
  return [
    {
      id: 1,
      name: 'Local Dev Instance',
      metaData: {
        description: 'This is for local dev',
        supportEmailRecipientsRoles: ['owner', 'administrator'],
        accessRequestEmailRecipientsRoles: ['owner', 'administrator'],
      },
      createdBy: '0cdd3800-1a96-4480-9d9f-5fdd0dfa422f',
      updatedBy: '0cdd3800-1a96-4480-9d9f-5fdd0dfa422f',
      createdAt: '2025-06-10 17:22:42',
      updatedAt: '2025-06-10 17:22:42',
      deletedAt: '2025-06-10 17:22:42',
      creator: {
        id: '0cdd3800-1a96-4480-9d9f-5fdd0dfa422f',
        firstName: 'Johnny',
        lastName: 'Appleseed',
        email: 'johnny.appleseed@lexisnexisrisk.com',
      },
      updater: {
        id: '0cdd3800-1a96-4480-9d9f-5fdd0dfa422f',
        firstName: 'Johnny',
        lastName: 'Appleseed',
        email: 'johnny.appleseed@lexisnexisrisk.com',
      },
    },
  ];
}

function getCluster() {
  return {
    id: uuidv4(),
    name: 'Play',
    thor_host: 'https://play.hpccsystems.com',
    thor_port: '18010',
    roxie_host: 'https://play.hpccsystems.com',
    roxie_port: '18002',
    username: null,
    hash: null,
    defaultEngine: 'hthor',
    timezone_offset: 0,
    accountMetaData: {
      lastMonitored: '2025-06-18T12:45:17.024Z',
      passwordExpiryAlertSentForDay: null,
    },
    adminEmails: ['johnny.appleseed@lexisnexisrisk.com'],
    reachabilityInfo: {
      reachable: true,
      lastMonitored: '2025-06-17T13:41:51.046Z',
      lastReachableAt: '2025-06-17T13:41:51.046Z',
    },
    storageUsageHistory: {},
    metaData: {
      reachabilityInfo: {
        reachable: true,
        lastMonitored: '2025-06-18T12:45:17.024Z',
        lastReachableAt: '2025-06-18T12:45:17.024Z',
        unReachableMessage: null,
      },
    },
    createdBy: {
      name: 'johnny appleseed',
      email: 'johnny.appleseed@lexisnexisrisk.com',
    },
    updatedBy: null,
    createdAt: '2025-06-16 20:42:30',
    updatedAt: '2025-06-18 12:45:17',
    deletedAt: null,
    allowSelfSigned: 1,
  };
}

function getSentNotification() {
  return {
    id: uuidv4(),
    searchableNotificationId: uuidv4(),
    applicationId: null,
    notifiedAt: null,
    notificationOrigin: 'User Registration',
    notificationChannel: 'email',
    notificationTitle: 'Verify your email',
    notificationDescription: 'Verify email',
    status: 'Pending Review',
    recipients: null,
    resolutionDateTime: null,
    comment: null,
    createdBy: { name: 'System' },
    createdAt: '2025-06-10 17:24:00',
    updatedBy: null,
    updatedAt: '2025-06-10 17:24:01',
    deletedAt: null,
    metaData: {
      notificationDetails: {
        cc: '',
        subject: 'Verify your email',
        htmlBody:
          '<!DOCTYPE html>\n<html>\n\n<head>\n  <style>\n    .main_body {\n      width: 100%;\n      border-bottom: 1px solid lightgray !important;\n    }\n\n    .section-footer-td {\n      color: #808080;\n      border-top: 1px solid #808080;\n    }\n\n    .section-header-td {\n      padding-top: 8px;\n      padding-bottom: 8px;\n    }\n\n    .list {\n      padding: 10px;\n    }\n\n    .tabbedText {\n      padding-left: 40px;\n    }\n\n    .bold-text {\n      font-weight: bold;\n    }\n\n    .important-text {\n      color: #FF0000;\n    }\n  </style>\n</head>\n\n<table class="main_body">\n  <tbody>\n    <tr>\n      <td>\n        <table>\n          <tbody>\n            <tr>\n              <td class="section-header-td">\n                <div>\n                  Hello,\n                </div>\n                <div>\n                  Thank you for registering with Tombolo! Please click the link below to verify your email and complete your registration.\n                </div>\n              </td>\n            </tr>\n\n\n            <tr>\n              <td class="section-header-td">\n                <div class="tabbedText"> </span> <a href=http://localhost:3000/register?regId=7970b63b-4b72-4855-a380-b47d48360f54> http://localhost:3000/register?regId=7970b63b-4b72-4855-a380-b47d48360f54</a> </div>\n              </td>\n            </tr>\n\n\n            <tr>\n              <td>\n                <p>\n                  <span class="important-text">Please take action within the next 24 hours.</span> If this email was unexpected, you can safely disregard it.\n                </p>\n              </td>\n            </tr>\n\n            <tr>\n              <td class="section-header-td">\n                <p> We look forward to having you on board! </p>\n              </td>\n            </tr>\n\n\n\n            <tr>\n              <td class="section-header-td">\n                <div>\n                  Best Regards,\n                </div>\n                <div>\n                  Tombolo\n                </div>\n              </td>\n            </tr>\n          </tbody>\n        </table>\n      </td>\n    </tr>\n  </tbody>\n</table>\n\n</html>',
        receiver: 'Johnny.appleseed@lexisnexisrisk.com',
        templateName: 'verifyEmail',
        recipientName: 'Johnny',
        validForHours: 24,
        mainRecipients: ['Johnny.appleseed@lexisnexisrisk.com'],
        notificationId: 'fcb1b41a-7a96-4f5b-856a-ad0f3cf62499',
        verificationLink:
          'http://localhost:3000/register?regId=7970b63b-4b72-4855-a380-b47d48360f54',
        notificationOrigin: 'User Registration',
        notificationQueueId: uuidv4(),
        notificationDescription: 'Verify email',
      },
    },
  };
}

function getLoginPayload(user) {
  return {
    registrationMethod: user.registrationMethod,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: testingPassword,
    deviceInfo: {
      os: 'macOS',
      browser: 'chrome',
    },
  };
}

function fakeValidateTokenMiddleware(req, res, next) {
  req.user = getUsers()[0];
  next();
}

const nonExistentID = uuidv4();

function getMockClusterForApi(clusterId) {
  return {
    id: clusterId || uuidv4(),
    thor_host: 'localhost',
    thor_port: 8010,
    username: 'testuser',
    hash: 'encrypted_password',
    allowSelfSigned: true,
  };
}

function getFileListQuery(clusterId) {
  return {
    clusterId: clusterId || uuidv4(),
    DropZoneName: 'test_dropzone',
    Netaddr: '10.0.0.1',
    Path: '/data/test',
    DirectoryOnly: 'false',
  };
}

const commonLzPayload = {
  id: uuidv4(),
  monitoringName: 'New LZ Monitor',
  isActive: false,
  lzMonitoringType: 'fileCount',
  approvalStatus: 'pending',
  approvedBy: null,
  approvedAt: null,
  approverComment: null,
  description: 'Monitoring landing zone',
  lastRunDetails: null,
  metaData: {},
  createdAt: '2025-06-30T10:00:00.000Z',
  updatedAt: '2025-06-30T10:00:00.000Z',
  deletedAt: null,
};

function getLandingZoneMonitoring(overrides = {}) {
  return {
    ...commonLzPayload,
    ...overrides,
  };
}

function getLandingZoneMonitoringCreatePayload(overrides = {}) {
  return {
    ...commonLzPayload,
    ...overrides,
  };
}

function getLandingZoneMonitoringUpdatePayload(
  id,
  validUserId,
  overrides = {}
) {
  return {
    id,
    monitoringName: 'Updated LZ Monitor',
    description: 'Updated description for landing zone monitoring',
    lzMonitoringType: 'spaceUsage',
    metaData: {},
    lastUpdatedBy: validUserId,
    ...overrides,
  };
}

module.exports = {
  getUsers,
  getInstanceSettings,
  getCluster,
  getSentNotification,
  getLoginPayload,
  getLandingZoneMonitoring,
  getLandingZoneMonitoringCreatePayload,
  getLandingZoneMonitoringUpdatePayload,
  getMockClusterForApi,
  getFileListQuery,
  fakeValidateTokenMiddleware,
  nonExistentID,
};
