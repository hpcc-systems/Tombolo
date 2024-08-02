const { application } = require("express");

const passwordExpiryInProximityNotificationPayload = ({
  clusterName,
  templateName,
  passwordDaysRemaining,
  recipients,
  notificationId,
}) => {
  const payload = {
    type: "email",
    mainRecipients: recipients,
    templateName,
    deliveryType: "immediate",
    notificationDescription: `HPCC cluster password for  (${clusterName}) is expiring in ${passwordDaysRemaining} days`,
    notificationOrigin: "Cluster Credential Monitoring",
    metaData: {
      notificationId,
      notificationOrigin: "Cluster Credential Monitoring",
      subject: `Alert: Your HPCC Cluster (${clusterName}) Password is Expiring Soon`,
      mainRecipients: recipients || [],
      issue: `Your password for the HPCC cluster  (${clusterName}) is expiring in ${passwordDaysRemaining} days. Please update your password in HPCC and then update your credentials in Tombolo.`,
      consequence: `If your password expires or Tombolo does not have your current HPCC credentials, Tombolo will not be able to communicate with the HPCC cluster. This will result in a failure of any jobs dependent on this communication.`,
      remedy: `Please take immediate action to avoid service disruption.`,
    },
  };
  return payload;
};

module.exports = {
  passwordExpiryInProximityNotificationPayload,
};
