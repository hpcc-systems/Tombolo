// imports
const { parentPort } = require("worker_threads");
const { Op } = require("sequelize");
const logger = require("../../config/logger");

//Local Imports
const models = require("../../models");
const user = models.user;
const NotificationQueue = models.notification_queue;

const { v4: uuidv4 } = require("uuid");
const { trimURL } = require("../../utils/authUtil");

const passwordResetLink = `${trimURL(process.env.WEB_URL)}/myaccount`;

const updateUserAndSendNotification = async (user, daysToExpiry, version) => {
  console.log(version);
  // Queue notification
  await NotificationQueue.create({
    type: "email",
    templateName: "passwordExpiryWarning",
    notificationOrigin: "Password Expiry Warning",
    deliveryType: "immediate",
    createdBy: "System",
    updatedBy: "System",
    metaData: {
      notificationId: uuidv4(),
      recipientName: `${user.dataValues.firstName}`,
      notificationOrigin: "Password Expiry Warning",
      subject: "Password Expiry Warning",
      mainRecipients: [user.dataValues.email],
      notificationDescription: "Password Expiry Warning",
      daysToExpiry: daysToExpiry,
      passwordResetLink: passwordResetLink,
    },
  });

  await user.update({
    metaData: {
      ...user.metaData,
      passwordExpiryEmailSent: {
        ...user.metaData.passwordExpiryEmailSent,
        [version]: true,
      },
    },
  });
};

(async () => {
  try {
    parentPort &&
      parentPort.postMessage({
        level: "info",
        text: "Password Expiry Job started ...",
      });

    const now = Date.now();

    // get all users where passwordExpiresAt is within 10 days
    const users = await user.findAll({
      where: {
        passwordExpiresAt: {
          [Op.lt]: now + 10 * 24 * 60 * 60 * 1000,
        },
      },
    });

    for (const user of users) {
      //pull out the internal user object for easier use below
      let userInternal = user.dataValues;

      const daysToExpiry = Math.floor(
        (userInternal.passwordExpiresAt - now) / (1000 * 60 * 60 * 24)
      );

      if (
        daysToExpiry <= 10 &&
        daysToExpiry > 3 &&
        !userInternal.metaData?.passwordExpiryEmailSent?.tenDay
      ) {
        logger.verbose(
          "User with email " +
            userInternal.email +
            " is within " +
            daysToExpiry +
            " days of password expiry."
        );

        let version = "tenDay";
        await updateUserAndSendNotification(user, daysToExpiry, version);
      }

      if (
        daysToExpiry <= 3 &&
        daysToExpiry > 1 &&
        !userInternal.metaData?.passwordExpiryEmailSent?.threeDay
      ) {
        logger.verbose(
          "User with email " +
            userInternal.email +
            " is within " +
            daysToExpiry +
            " days of password expiry."
        );
        let version = "threeDay";
        await updateUserAndSendNotification(user, daysToExpiry, version);
      }
      if (
        daysToExpiry <= 1 &&
        !userInternal.metaData?.passwordExpiryEmailSent?.oneDay
      ) {
        logger.verbose(
          "User with email " +
            userInternal.email +
            " is within " +
            daysToExpiry +
            " days of password expiry."
        );

        let version = "oneDay";
        await updateUserAndSendNotification(user, daysToExpiry, version);
      }
    }

    parentPort &&
      parentPort.postMessage({
        level: "info",
        text: "Job to remove unverified user completed ...",
      });
  } catch (error) {
    parentPort &&
      parentPort.postMessage({ level: "error", text: error.message });
  }
})();
