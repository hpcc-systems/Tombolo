const logger = require('../config/logger');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const {
  user,
  RoleType,
  UserRole,
  InstanceSetting,
  AccountVerificationCode,
  NotificationQueue,
  sequelize,
} = require('../models');
const {
  trimURL,
  checkPasswordSecurityViolations,
} = require('../utils/authUtil');

// Main controller function
const createInstanceSettingFirstRun = async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const { name, description, firstName, lastName, email, password } =
      req.body;

    // Step 1: Check if user already exists
    sendUpdate(res, {
      event: 'info',
      step: 1,
      message: 'Verifying if the email is already in use ...',
    });
    const existingUser = await user.findOne({ where: { email } });
    if (existingUser) {
      sendUpdate(res, {
        event: 'error',
        message: 'A user with the provided email already exists.',
      });
      return res.end();
    } else {
      sendUpdate(res, {
        event: 'success',
        message: 'No existing account is associated with the email provided.',
      });
    }

    // Step 2: Create new user
    let newUser = null;
    try {
      sendUpdate(res, { event: 'info', step: 2, message: 'Creating user ...' });
      newUser = await createUser(
        {
          firstName,
          lastName,
          email,
          password,
        },
        transaction
      );

      sendUpdate(res, {
        event: 'success',
        message: 'User created successfully.',
      });
    } catch (err) {
      logger.error(err.message);
      sendUpdate(res, { event: 'error', message: 'Failed to create user.' });
      transaction.rollback();
      return res.end();
    }

    // Step 3: Assign owner role
    sendUpdate(res, {
      event: 'info',
      step: 3,
      message: 'Assigning owner role ...',
    });
    try {
      await assignOwnerRole(newUser.id, transaction);
      sendUpdate(res, { event: 'success', message: 'Owner role assigned.' });
    } catch (err) {
      logger.error(err.message);
      sendUpdate(res, {
        event: 'error',
        message: 'Failed to assign owner role.',
      });
      await transaction.rollback();
      return res.end();
    }

    // Step 4: Create instance settings
    try {
      sendUpdate(res, {
        event: 'info',
        step: 4,
        message: 'Creating instance settings ...',
      });
      await manageInstanceSettings(
        { name, userId: newUser.id, description },
        transaction
      );
      sendUpdate(res, {
        event: 'success',
        message: 'Instance settings created.',
      });
    } catch (err) {
      logger.error(err.message);
      sendUpdate(res, {
        event: 'error',
        message: 'Failed to create instance settings.',
      });
      await transaction.rollback();
      return res.end();
    }

    // Step 5: Send verification email
    try {
      sendUpdate(res, {
        event: 'info',
        step: 5,
        message: 'Sending verification email ...',
      });
      await sendVerificationEmail(newUser, transaction);
      sendUpdate(res, {
        event: 'success',
        message: 'Verification email sent.',
      });
    } catch (err) {
      logger.error(err.message);
      sendUpdate(res, {
        event: 'error',
        message: 'Failed to send verification email.',
      });
      await transaction.rollback();
      return res.end();
    }

    // Commit the transaction if everything goes successfully
    await transaction.commit();

    // Final response
    sendUpdate(res, {
      event: 'success',
      step: 999,
      message:
        'Setup complete. Please check your email for the verification link.',
    });

    // Close SSE connection after sending the final update
    res.end();
  } catch (err) {
    await transaction.rollback();
    logger.error(err.message);
    sendUpdate(res, {
      event: 'error',
      message: 'Setup failed due to a server error',
    });
    res.end();
  }
};

// Helper: Send SSE updates to the client
const sendUpdate = (res, data) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  res.flush();
};

// Helper: Create user
const createUser = async (
  { firstName, lastName, email, password },
  transaction
) => {
  const errors = checkPasswordSecurityViolations({
    password: password,
    user: { email, firstName, lastName },
    newUser: true,
  });
  if (errors.length > 0) {
    throw new Error('Password does not meet security requirements');
  }
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return user.create(
    {
      firstName,
      lastName,
      email,
      hash,
      registrationMethod: 'traditional',
      forcePasswordReset: false,
      passwordExpiresAt: new Date(
        new Date().setDate(new Date().getDate() + 90)
      ),
      metaData: {
        passwordExpiryEmailSent: {
          first: false,
          second: false,
          third: false,
          final: false,
        },
        accountDeleteEmailSent: {
          first: false,
          second: false,
          third: false,
          final: false,
        },
        previousPasswords: [hash],
      },
    },
    { transaction }
  );
};

// Helper: Assign owner role
const assignOwnerRole = async (userId, transaction) => {
  const { id: ownerId } = await RoleType.findOne({
    where: { roleName: 'owner' },
  });
  await UserRole.create(
    {
      userId,
      roleId: ownerId,
      createdBy: userId,
    },
    { transaction }
  );
};

// Helper: Manage instance settings
const manageInstanceSettings = async (
  { name, userId, description },
  transaction
) => {
  await InstanceSetting.destroy({ where: {} }, { transaction });
  await InstanceSetting.create(
    {
      name,
      metaData: {
        description,
        supportEmailRecipientsRoles: ['owner', 'administrator'],
        accessRequestEmailRecipientsRoles: ['owner', 'administrator'],
      },
      createdBy: userId,
      updatedBy: userId,
    },
    { transaction }
  );
};

// Helper: Send verification email
const sendVerificationEmail = async (user, transaction) => {
  const verificationCode = uuidv4();
  const notificationId = uuidv4();

  await AccountVerificationCode.create(
    {
      code: verificationCode,
      userId: user.id,
      expiresAt: new Date(Date.now() + 86400000), // 24 hours
    },
    { transaction }
  );

  await NotificationQueue.create(
    {
      type: 'email',
      templateName: 'verifyEmail',
      notificationOrigin: 'User Registration',
      deliveryType: 'immediate',
      metaData: {
        notificationId,
        recipientName: `${user.firstName}`,
        verificationLink: `${trimURL(
          process.env.WEB_URL
        )}/register?regId=${verificationCode}`,
        notificationOrigin: 'User Registration',
        subject: 'Verify your email',
        mainRecipients: [user.email],
        notificationDescription: 'Verify email',
        validForHours: 24,
      },
      createdBy: user.id,
    },
    { transaction }
  );
};

module.exports = {
  createInstanceSettingFirstRun,
};
