// Imports from node modules
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const moment = require('moment');

// Local Imports
const logger = require('../config/logger');
const { sendError } = require('./response');
const {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  TOKEN_COOKIE_MAX_AGE,
} = require('../config/tokens');
const {
  User,
  UserRole,
  RoleType,
  UserArchive,
  UserApplication,
  Application,
  InstanceSetting,
  NotificationQueue,
  AccountVerificationCode,
} = require('../models');
const { generateToken } = require('../middlewares/csrfMiddleware');
const bcrypt = require('bcryptjs');

const csrfHeaderName = 'x-csrf-token';

// Generate access token
const generateAccessToken = user => {
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

// Generate refresh token
const generateRefreshToken = (tokenId, customExpiry = null) => {
  const options = customExpiry
    ? { expiresIn: Math.floor((customExpiry.getTime() - Date.now()) / 1000) } // seconds until custom expiry
    : { expiresIn: REFRESH_TOKEN_EXPIRY }; // default from config

  return jwt.sign(tokenId, process.env.JWT_REFRESH_SECRET, options);
};

// Verify token
const verifyToken = token => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
const verifyRefreshToken = token => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// Get user by E-mail or ID
// identifier is either email or id , example : getAUser({id: 'xyz'}) or getAUser({email: 'xyz@xyz.com'})
const getAUser = async identifier => {
  return await User.findOne({
    where: { ...identifier },
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
      {
        model: UserApplication,
        attributes: ['id'],
        as: 'applications',
        include: [
          {
            model: Application,
            attributes: ['id', 'title', 'description'],
          },
        ],
      },
      {
        model: AccountVerificationCode,
        attributes: ['code'],
        as: 'AccountVerificationCodes',
      },
    ],
  });
};

const setTokenCookie = async (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: TOKEN_COOKIE_MAX_AGE, // From config
  });
  return true;
};

const generateAndSetCSRFToken = async (req, res, accessToken) => {
  try {
    //set token in req as well so csrf token can be generated
    req.cookies.token = accessToken;

    const csrfToken = generateToken(req, res, true);

    //attach csrfToken to x-csrf-token header
    res.setHeader(csrfHeaderName, csrfToken);

    return true;
  } catch (e) {
    logger.error('Error while generating csrf token:' + e);
    return sendError(res, 'Internal Server Error', 500);
  }
};

//function to trim url so we can have consistent links without //
const trimURL = url => {
  //cut off last character if it is a slash
  if (url[url.length - 1] === '/') {
    url = url.slice(0, -1);
  }
  return url;
};

const setPasswordExpiry = user => {
  //set forcePasswordReset to 0
  user.forcePasswordReset = 0;
  //set passwordExpiry to 90 days
  user.passwordExpiresAt = new Date(
    new Date().setDate(new Date().getDate() + 90)
  );

  //reset password Expiry email sent flags
  user.metaData = {
    ...user.metaData,
    passwordExpiryEmailSent: {
      first: false,
      second: false,
      third: false,
      final: false,
    },
  };
  return user;
};

const setLastLoginAndReturn = user => {
  user.lastLoginAt = new Date();

  //reset password Expiry email sent flags
  user.metaData = {
    ...user.metaData,
    accountDeleteEmailSent: {
      first: false,
      second: false,
      third: false,
      final: false,
    },
  };
  return user;
};

// Get Support Notification Recipient's Emails
const getSupportContactEmails = async () => {
  // Get Instance Setting
  const instanceSetting = await InstanceSetting.findOne({ raw: true });

  let supportEmailRecipientsEmail =
    instanceSetting.metaData.supportEmailRecipients || [];
  let supportEmailRecipientsRoles =
    instanceSetting.metaData.supportEmailRecipientsRoles || [];
  const supportRolesEmail = [];

  // If support email recipients exist and no support email recipients roles
  if (
    supportEmailRecipientsEmail.length > 0 &&
    supportEmailRecipientsRoles.length === 0
  ) {
    return supportEmailRecipientsEmail;
  }

  //if there is no contact email, get a list of all owner and admin emails
  const ownerAndAdminEmails = await User.findAll({
    include: [
      {
        model: UserRole,
        attributes: ['id'],
        as: 'roles',
        required: true, // ensures only users with matching role types are included (INNER JOIN instead of LEFT JOIN).
        include: [
          {
            model: RoleType,
            as: 'role_details',
            attributes: ['id', 'roleName'],
            where: { roleName: { [Op.in]: supportEmailRecipientsRoles } },
          },
        ],
      },
    ],
  });

  // Get the e-mail addresses
  ownerAndAdminEmails.forEach(user => {
    supportRolesEmail.push(user.email);
  });

  //return them
  return [...supportEmailRecipientsEmail, ...supportRolesEmail];
};

// Get Access Request Notification Recipient's Emails
const getAccessRequestContactEmails = async () => {
  // Get Instance Setting
  const instanceSetting = await InstanceSetting.findOne({ raw: true });

  let accessRequestEmailRecipientsEmail =
    instanceSetting.metaData.accessRequestEmailRecipientsEmail || [];
  let accessRequestEmailRecipientsRoles =
    instanceSetting.metaData.accessRequestEmailRecipientsRoles || [];
  const accessRequestRolesEmail = [];

  // If access email recipients exist and no support email recipients roles
  if (
    accessRequestEmailRecipientsEmail.length > 0 &&
    accessRequestEmailRecipientsRoles.length === 0
  ) {
    return accessRequestEmailRecipientsEmail;
  }

  //if access email recipients do not exist, get emails for the roles specified to receive access request emails
  const ownerAndAdminEmails = await User.findAll({
    include: [
      {
        model: UserRole,
        attributes: ['id'],
        as: 'roles',
        required: true, // ensures only users with matching role types are included (INNER JOIN instead of LEFT JOIN).
        include: [
          {
            model: RoleType,
            as: 'role_details',
            attributes: ['id', 'roleName'],
            where: { roleName: { [Op.in]: accessRequestEmailRecipientsRoles } },
          },
        ],
      },
    ],
  });

  // Get the e-mail addresses
  ownerAndAdminEmails.forEach(user => {
    accessRequestRolesEmail.push(user.email);
  });

  return [...accessRequestEmailRecipientsEmail, ...accessRequestRolesEmail];
};

const sendPasswordExpiredEmail = async user => {
  //check that lastAdminNotification was more than 24 hours ago to avoid spamming the admin
  const currentTime = new Date();
  const lastAdminNotification = new Date(
    user.metaData.passwordExpiryEmailSent.lastAdminNotification
  );

  const timeSinceLastNotification =
    (currentTime - lastAdminNotification) / 1000 / 60 / 60;

  if (timeSinceLastNotification < 24 || !isNaN(timeSinceLastNotification)) {
    return {
      success: false,
      message: 'Password reset request is pending',
    };
  }

  //get contact email
  const contactEmail = await getSupportContactEmails();

  //send notification to contact email
  await NotificationQueue.create({
    type: 'email',
    templateName: 'passwordExpiredAdmin',
    notificationOrigin: 'Password Expiry',
    deliveryType: 'immediate',
    metaData: {
      notificationId: uuidv4(),
      recipientName: 'Admin',
      notificationOrigin: 'Password Expiry',
      subject: 'User password has expired - Requesting reset',
      mainRecipients: contactEmail,
      notificationDescription: 'User password has expired - Requesting reset',
      passwordResetLink: `${trimURL(process.env.WEB_URL)}/admin/usermanagement`,
      userName: user.firstName + ' ' + user.lastName,
      userEmail: user.email,
    },
    createdBy: user.id,
  });
  await user.update({
    metaData: {
      ...user.metaData,
      passwordExpiryEmailSent: {
        ...user.metaData.passwordExpiryEmailSent,
        lastAdminNotification: currentTime,
      },
    },
  });
  return {
    success: true,
    message: 'Request submitted',
  };
};

const checkPasswordSecurityViolations = ({ password, user, newUser }) => {
  //check password for user.email, user.firstName, user.lastName
  const passwordViolations = [];

  const email = user.email;
  const firstName = user.firstName;
  const lastName = user.lastName;
  const previousPasswords = user?.metaData?.previousPasswords || [];

  if (password.includes(email)) {
    passwordViolations.push('Password contains email address');
  }

  //check if password contains first name
  if (password.includes(firstName)) {
    passwordViolations.push('Password contains first name');
  }

  //check if password contains last name
  if (password.includes(lastName)) {
    passwordViolations.push('Password contains last name');
  }

  //dont do previous password check if it is a new user being registered
  if (!newUser) {
    //TODO -- check if password contains any of previous 12 passwords
    previousPasswords.forEach(oldPassword => {
      if (bcrypt.compareSync(password, oldPassword)) {
        passwordViolations.push(
          'Password cannot be the same as one of the previous passwords'
        );
      }
    });
  }

  return passwordViolations;
};

const setPreviousPasswords = async user => {
  //get existing previous passwords
  let previousPasswords = user.metaData.previousPasswords || [];

  //add current password to the list
  previousPasswords.push(user.hash);

  //if there are more than 12 previous passwords, remove the oldest one
  if (previousPasswords.length > 12) {
    previousPasswords.shift();
  }

  user.metaData.previousPasswords = previousPasswords;

  return user;
};

// Generate a random password - 12 chars
function generatePassword(length = 12) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const allChars = lowercase + uppercase + numbers;

  let password = '';

  // Ensure at least one of each category
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));

  // Fill the rest randomly
  for (let i = 3; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle password to mix guaranteed characters
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

const setLastLogin = async user => {
  const date = new Date();

  const updatedUser = await User.update(
    {
      loginAttempts: 0,
      lastLoginAt: date,
      metaData: {
        ...user.metaData,
        accountDeleteEmailSent: {
          first: false,
          second: false,
          third: false,
          final: false,
        },
      },
    },
    {
      where: {
        id: user.id,
      },
    }
  );

  if (updatedUser.length !== 1) {
    logger.error('Failed to update last login time for user: ' + user.id);
  }

  return;
};

// Record failed login attempt
const handleInvalidLoginAttempt = async ({ user, errMessage }) => {
  const loginAttempts = user.loginAttempts + 1;
  const accountLocked = user.accountLocked;

  if (loginAttempts === 5) {
    const newAccLockedData = {
      isLocked: true,
      lockedReason: [
        ...new Set([...accountLocked.lockedReason, 'reachedMaxLoginAttempts']),
      ],
    };

    // Update user record
    await User.update(
      {
        loginAttempts: loginAttempts,
        accountLocked: newAccLockedData,
      },
      { where: { id: user.id } }
    );

    // Queue notification
    await sendAccountLockedEmail(user);
  } else {
    // Update user record
    await User.update(
      { loginAttempts: loginAttempts },
      { where: { id: user.id } }
    );
  }

  // Incorrect E-mail password combination error
  const invalidCredentialsErr = new Error(errMessage);
  invalidCredentialsErr.status = 401;
  invalidCredentialsErr.name = 'UnauthorizedError';
  throw invalidCredentialsErr;
};

// Function to send account locked email
const sendAccountLockedEmail = async user => {
  // Get support email recipients
  const supportEmailRecipients = await getSupportContactEmails();

  await NotificationQueue.create({
    type: 'email',
    templateName: 'accountLocked',
    notificationOrigin: 'User Authentication',
    deliveryType: 'immediate',
    metaData: {
      notificationId: `ACC_LOCKED_${moment().format('YYYYMMDD_HHmmss_SSS')}`,
      recipientName: user.firstName,
      notificationOrigin: 'User Authentication',
      subject: 'Your account has been locked',
      mainRecipients: [user.email],
      notificationDescription:
        'Account locked because of too many failed login attempts',
      userName: user.firstName,
      userEmail: user.email,
      supportEmailRecipients,
    },
    createdBy: user.id,
  });
};

// Send account unlocked email
const sendAccountUnlockedEmail = async ({
  user,
  tempPassword,
  verificationCode,
}) => {
  await NotificationQueue.create({
    type: 'email',
    templateName: 'accountUnlocked',
    notificationOrigin: 'User Authentication',
    deliveryType: 'immediate',
    metaData: {
      notificationId: `ACC_UNLOCKED_${moment().format('YYYYMMDD_HHmmss_SSS')}`,
      recipientName: user.firstName,
      notificationOrigin: 'User Authentication',
      subject: 'Your Account Has Been Unlocked – Action Required',
      mainRecipients: [user.email],
      notificationDescription: 'Account unlocked by admin',
      userName: user.firstName + ' ' + user.lastName,
      userEmail: user.email,
      tempPassword,
      passwordResetLink: `${trimURL(
        process.env.WEB_URL
      )}/reset-temporary-password/${verificationCode}`,
    },
    createdBy: user.id,
  });
};

const checkIfSystemUser = userObj => {
  if (!userObj) return false;
  return (
    userObj.firstName === 'System' &&
    userObj.lastName === 'User' &&
    userObj.email === 'system-user@example.com'
  );
};

const deleteUser = async (id, reason) => {
  try {
    if (!reason || reason === '') {
      throw new Error('Reason for deletion is required');
    }

    //get user
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error('User not found');
    }

    if (checkIfSystemUser(user)) {
      throw new Error('System user cannot be deleted');
    }

    const removedAt = Date.now();
    const removedBy = reason;

    //remove hash from user
    user.dataValues.hash = null;

    const archivedUser = await UserArchive.create({
      ...user.dataValues,
      removedAt,
      removedBy,
    });

    if (!archivedUser) {
      throw new Error('Failed to archive user');
    }

    //hard delete without paranoid
    await User.destroy({
      where: {
        id: id,
      },
      force: true,
    });

    return true;
  } catch (e) {
    logger.error('Error while deleting user:' + e);
    return false;
  }
};

// Get access request notification recipients from instance settings and role-based recipients
const getAccessRequestRecipients = async () => {
  try {
    const instance_setting = await InstanceSetting.findOne({ raw: true });

    if (!instance_setting) {
      logger.warn('No instance settings found for notification recipients');
      return [];
    }

    const { metaData } = instance_setting;
    let recipients = metaData?.accessRequestEmailRecipientsEmail || [];

    // Get emails from users with specified roles
    if (
      metaData?.accessRequestEmailRecipientsRoles &&
      metaData.accessRequestEmailRecipientsRoles.length > 0
    ) {
      const roles = metaData.accessRequestEmailRecipientsRoles;

      // Get role ids
      const roleDetails = await RoleType.findAll({
        where: { roleName: roles },
        raw: true,
      });

      const roleIds = roleDetails.map(r => r.id);

      // Get all users with the roleIds above
      const users = await UserRole.findAll({
        where: { roleId: roleIds },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          },
        ],
      });

      const emails = users.map(u => u.user.email);
      recipients = [...recipients, ...emails];
    }

    // Remove duplicates and filter out empty values
    return [...new Set(recipients.filter(email => email && email.trim()))];
  } catch (error) {
    logger.error(`Error getting notification recipients: ${error.message}`);
    return [];
  }
};

//Exports
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  getAUser,
  setTokenCookie,
  generateAndSetCSRFToken,
  trimURL,
  setPasswordExpiry,
  sendPasswordExpiredEmail,
  checkPasswordSecurityViolations,
  getSupportContactEmails,
  getAccessRequestContactEmails,
  setPreviousPasswords,
  generatePassword,
  setLastLogin,
  setLastLoginAndReturn,
  handleInvalidLoginAttempt,
  sendAccountUnlockedEmail,
  deleteUser,
  checkIfSystemUser,
  getAccessRequestRecipients,
};
