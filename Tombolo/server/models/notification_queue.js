"use strict";
module.exports = (sequelize, DataTypes) => {
  const NotificationQueue = sequelize.define(
    "notification_queue",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM("msTeams", "email"),
      },
      notificationOrigin: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      /*
      This is the id of the monitoring that triggered the notification
      allowNull: true because this field will be null for manual notifications and other notifications that are not triggered by a monitoring
      This is required so that we can filter notifications by monitoring
      */
      originationId: {
        allowNull: true,
        type: DataTypes.UUID,
      },
      deliveryType: {
        allowNull: false,
        type: DataTypes.ENUM("immediate", "scheduled"),
      },
      deliveryTime: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      templateName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      lastScanned: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      attemptCount: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      reTryAfter: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      failureMessage: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: "System",
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedBy: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: "System",
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    {
      freezeTableName: true,
    }
  );

  return NotificationQueue;
};

// SAMPLE PAYLOADS
// E-mail notification
/*
{
// "id": uuid
"type": "email",
"notificationOrigin": "sampleOrigin",
"deliveryType":  "immediate",
"deliveryTime": null,
// "lastScanned": null,
// "attemptCount":
// "failureMessage" : 
// "retryAfter": null,
"createdBy": "{name: 'John Doe', email: john.doe@testemail.com, id: doe01",
"updatedBy": "{name: 'John Doe', email: john.doe@testemail.com, id: doe01",
"metaData": {
   "emailDetails" : {
        "mainRecipients" : [ "john.doe@testemail.com", "test-teams-email@.onmicrosoft.comamer.teams.ms"],
        "cc": ["jane.doe@testemail.com"],
        "subject" : "This is a manual notification for test",
         "body" : "If notification is manual, you cannot send data that will be passed to a template . You need to pass plain text message",
        "data" : {
            "jobName" : "Test Job",
            "clusterName" : "4 Way Cluster",
            "state" :"Failed",
            "actions": ["Take corrective action ASAP", "Re run job", "Abort dependent jobs"]
        }}
        }
}
*/

// MS Teams notification
/*
{
// "id": uuid
"type": "msTeams",
"notificationOrigin": "sampleOrigin",
"deliveryType":  "immediate",
"deliveryTime": null,
// "lastScanned": null,
// "attemptCount":
// "failureMessage" : 
// "retryAfter": null,
"createdBy": "{name: 'John Doe', email: john.doe@testemail.com, id: doe01",
"updatedBy": "{name: 'John Doe', email: john.doe@testemail.com, id: doe01",
"metaData": {
    "msTeamsDetails" : {
        "recipients" : ["df325211-0b49-4a6a-8f49-124fd8879ab8", "9c421c55-31a7-4ec7-95b2-bf27c10e6256" ],
        "subject" : "This is a manual notification for test",
        "body" : "If notification is manual, you cannot send data that will be passed to a template . You need to pass plain text message",
        "data":{
            "jobName" : "Test Job",
            "clusterName" : "Name of cluster",
            "state" :"Failed",
            "actions": ["Take corrective action ASAP", "Re run job", "Abort dependent jobs"]
        }
      }
        }
}
*/
