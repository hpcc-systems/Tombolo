// imports from node modules
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

//Local Imports
import { logOrPostMessage } from '../jobUtils.js';
import { User, NotificationQueue } from '../../models.js';
import { trimURL, getSupportContactEmails } from '../../utils/authUtil.js';

// Constants
const passwordResetLink = `${trimURL(process.env.WEB_URL)}/myaccount`;
const passwordExpiryAlertDaysForUser =
  require('../../config/monitorings.js').passwordExpiryAlertDaysForUser;

const updateUserAndSendNotification = async (user, daysToExpiry, version) => {
  // Queue notification
  await NotificationQueue.create({
    type: 'email',
    templateName: 'passwordExpiryWarning',
    notificationOrigin: 'Password Expiry Warning',
    deliveryType: 'immediate',
    createdBy: 'System',
    updatedBy: 'System',
    metaData: {
      notificationId: uuidv4(),
      recipientName: `${user.dataValues.firstName}`,
      notificationOrigin: 'Password Expiry Warning',
      subject: 'Password Expiry Warning',
      mainRecipients: [user.dataValues.email],
      notificationDescription: 'Password Expiry Warning',
      daysToExpiry: daysToExpiry,
      expiryDate: new Date(user.dataValues.passwordExpiresAt).toDateString(),
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
    logOrPostMessage({
      level: 'info',
      text: 'Password Expiry Job started ...',
    });

    const now = Date.now();

    // get all users where passwordExpiresAt is within 10 days
    const users = await User.findAll({
      where: {
        passwordExpiresAt: {
          [Op.lt]: now + 10 * 24 * 60 * 60 * 1000,
        },
      },
    });

    for (const user of users) {
      //pull out the internal user object for easier use below
      let userInternal = user.dataValues;

      const daysToExpiry =
        Math.floor(
          (userInternal.passwordExpiresAt - now) / (1000 * 60 * 60 * 24)
        ) + 1;

      if (
        daysToExpiry <= passwordExpiryAlertDaysForUser[0] &&
        daysToExpiry > passwordExpiryAlertDaysForUser[1] &&
        !userInternal.metaData?.passwordExpiryEmailSent?.first
      ) {
        logOrPostMessage({
          level: 'verbose',
          text:
            'User with email ' +
            userInternal.email +
            ' is within ' +
            daysToExpiry +
            ' days of password expiry.',
        });

        let version = 'first';
        await updateUserAndSendNotification(user, daysToExpiry, version);
      }

      if (
        daysToExpiry <= passwordExpiryAlertDaysForUser[1] &&
        daysToExpiry > passwordExpiryAlertDaysForUser[2] &&
        !userInternal.metaData?.passwordExpiryEmailSent?.second
      ) {
        logOrPostMessage({
          level: 'verbose',
          text:
            'User with email ' +
            userInternal.email +
            ' is within ' +
            daysToExpiry +
            ' days of password expiry.',
        });
        let version = 'second';
        await updateUserAndSendNotification(user, daysToExpiry, version);
      }
      if (
        daysToExpiry <= passwordExpiryAlertDaysForUser[2] &&
        daysToExpiry > 0 &&
        !userInternal.metaData?.passwordExpiryEmailSent?.third
      ) {
        logOrPostMessage({
          level: 'verbose',
          text:
            'User with email ' +
            userInternal.email +
            ' is within ' +
            daysToExpiry +
            ' days of password expiry.',
        });

        let version = 'third';
        await updateUserAndSendNotification(user, daysToExpiry, version);
      }

      if (
        daysToExpiry <= 0 &&
        !userInternal.metaData?.passwordExpiryEmailSent?.final
      ) {
        logOrPostMessage({
          level: 'verbose',
          text:
            'User with email ' +
            userInternal.email +
            ' has an expired password.',
        });

        let emails = 'mailto:' + (await getSupportContactEmails());

        // Queue notification
        await NotificationQueue.create({
          type: 'email',
          templateName: 'passwordExpired',
          notificationOrigin: 'Password Expired',
          deliveryType: 'immediate',
          createdBy: 'System',
          updatedBy: 'System',
          metaData: {
            notificationId: uuidv4(),
            recipientName: `${userInternal.firstName}`,
            notificationOrigin: 'Password Expired',
            subject: 'Password Expired',
            mainRecipients: [userInternal.email],
            notificationDescription: 'Password Expired',
            contactEmails: emails,
          },
        });

        await user.update({
          forcePasswordReset: true,
          metaData: {
            ...user.metaData,
            passwordExpiryEmailSent: {
              ...user.metaData.passwordExpiryEmailSent,
              final: true,
            },
          },
        });
      }
    }

    logOrPostMessage({
      level: 'info',
      text: 'Password expiry check job completed ...',
    });
  } catch (error) {
    logOrPostMessage({ level: 'error', text: error.message });
  }
})();
