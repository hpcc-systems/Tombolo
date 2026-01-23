// imports from node modules
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

//Local Imports
import { logOrPostMessage } from '../jobUtils.js';
import { User, UserRole, RoleType, NotificationQueue } from '../../models.js';
import { trimURL, deleteUser } from '../../utils/authUtil.js';

// Constants
const accountUnlockLink = `${trimURL(process.env.WEB_URL)}`;

const accountDeleteAlertDaysForUser =
  require('../../config/monitorings.js').accountDeleteAlertDaysForUser;

const updateUserAndSendNotification = async (user, daysToExpiry, version) => {
  const expiryDate = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * daysToExpiry
  ).toDateString();

  // Queue notification
  await NotificationQueue.create({
    type: 'email',
    templateName: 'accountDeleteWarning',
    notificationOrigin: 'Account Delete Warning',
    deliveryType: 'immediate',
    createdBy: 'System',
    updatedBy: 'System',
    metaData: {
      notificationId: uuidv4(),
      recipientName: `${user.dataValues.firstName}`,
      notificationOrigin: 'Account Delete Warning',
      subject: 'Account Deletion Warning',
      mainRecipients: [user.dataValues.email],
      notificationDescription: 'Account Delete Warning',
      daysToExpiry: daysToExpiry,
      expiryDate: expiryDate,
      accountUnlockLink: accountUnlockLink,
    },
  });

  await user.update({
    metaData: {
      ...user.metaData,
      accountDeleteEmailSent: {
        ...user.metaData.accountDeleteEmailSent,
        [version]: true,
      },
    },
  });
};

(async () => {
  try {
    logOrPostMessage({
      level: 'info',
      text: 'Account Deletion Job started ...',
    });

    //get all relevant dates in easy to understand variables
    const now = Date.now();
    const deletionDate = now - 1000 * 60 * 60 * 24 * 180; // 180 days
    const firstDeleteWarningDate =
      deletionDate + 1000 * 60 * 60 * 24 * accountDeleteAlertDaysForUser[0]; // first accountDeleteAlertDaysForUser[0] days

    //get all users where lastLoginAt is older than firstDeleteWarningDate
    const users = await User.findAll({
      where: {
        lastLoginAt: {
          [Op.lt]: firstDeleteWarningDate,
        },
      },
      include: [
        {
          model: UserRole,
          attributes: ['id'],
          as: 'roles',
          include: [
            {
              model: RoleType,
              as: 'role_details',
              attributes: ['id', 'roleName'],
            },
          ],
        },
      ],
    });

    //filter out admins and owners
    const filteredUsers = users.filter(user => {
      return !user.roles.some(role => {
        return (
          role?.role_details?.roleName === 'administrator' ||
          role?.role_details?.roleName === 'owner'
        );
      });
    });

    for (const user of filteredUsers) {
      //pull out the internal user object for easier use below
      let userInternal = user.dataValues;
      const lastLoginAt = userInternal.lastLoginAt;
      const daysToExpiry =
        Math.floor((lastLoginAt - deletionDate) / (1000 * 60 * 60 * 24)) + 1;

      if (
        daysToExpiry <= accountDeleteAlertDaysForUser[0] &&
        daysToExpiry > accountDeleteAlertDaysForUser[1] &&
        !userInternal.metaData?.accountDeleteEmailSent?.first
      ) {
        logOrPostMessage({
          level: 'verbose',
          text:
            'User with email ' +
            userInternal.email +
            ' is within ' +
            daysToExpiry +
            ' days of account deletion due to inactivity.',
        });

        let version = 'first';
        await updateUserAndSendNotification(user, daysToExpiry, version);
      }

      if (
        daysToExpiry <= accountDeleteAlertDaysForUser[1] &&
        daysToExpiry > accountDeleteAlertDaysForUser[2] &&
        !userInternal.metaData?.accountDeleteEmailSent?.second
      ) {
        logOrPostMessage({
          level: 'verbose',
          text:
            'User with email ' +
            userInternal.email +
            ' is within ' +
            daysToExpiry +
            ' days of account deletion due to inactivity.',
        });
        let version = 'second';
        await updateUserAndSendNotification(user, daysToExpiry, version);
      }
      if (
        daysToExpiry <= accountDeleteAlertDaysForUser[2] &&
        daysToExpiry > 0 &&
        !userInternal.metaData?.accountDeleteEmailSent?.third
      ) {
        logOrPostMessage({
          level: 'verbose',
          text:
            'User with email ' +
            userInternal.email +
            ' is within ' +
            daysToExpiry +
            ' days of account deletion due to inactivity',
        });

        let version = 'third';
        await updateUserAndSendNotification(user, daysToExpiry, version);
      }

      if (
        daysToExpiry <= 0 &&
        !userInternal.metaData?.accountDeleteEmailSent?.final
      ) {
        logOrPostMessage({
          level: 'verbose',
          text:
            'User with email ' +
            userInternal.email +
            ' has been removed due to inactivity.',
        });

        const accountUnlockLink = `${trimURL(process.env.WEB_URL)}/register`;
        // Queue notification
        await NotificationQueue.create({
          type: 'email',
          templateName: 'accountDeleted',
          notificationOrigin: 'Account Deleted',
          deliveryType: 'immediate',
          createdBy: 'System',
          updatedBy: 'System',
          metaData: {
            notificationId: uuidv4(),
            recipientName: `${userInternal.firstName}`,
            notificationOrigin: 'Account Deleted',
            subject: 'Account Deleted',
            mainRecipients: [userInternal.email],
            notificationDescription: 'Account Deleted',
            accountUnlockLink: accountUnlockLink,
          },
        });

        // delete user account
        const deleted = await deleteUser(userInternal.id, 'Inactivity');
        if (!deleted) {
          logOrPostMessage({
            level: 'error',
            text:
              'Failed to delete userwith email ' +
              userInternal.email +
              ', due to inactivity.',
          });
        }
      }
    }

    logOrPostMessage({
      level: 'info',
      text: 'Account Delete check job completed ...',
    });
  } catch (error) {
    logOrPostMessage({ level: 'error', text: error.message });
  }
})();
