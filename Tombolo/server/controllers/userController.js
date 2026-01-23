// Imports from node modules
const { v4: UUIDV4 } = require('uuid');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

// Local imports
const logger = require('../config/logger');
const { sendSuccess, sendError } = require('../utils/response');
const {
  User,
  UserRole,
  UserApplication,
  NotificationQueue,
  AccountVerificationCode,
  PasswordResetLink,
  RefreshToken,
} = require('../models');
const {
  setPasswordExpiry,
  trimURL,
  checkPasswordSecurityViolations,
  setPreviousPasswords,
  generatePassword,
  sendAccountUnlockedEmail,
  deleteUser: deleteUserUtil,
  checkIfSystemUser,
  generateAccessToken,
  generateRefreshToken,
  setTokenCookie,
  generateAndSetCSRFToken,
} = require('../utils/authUtil');

const whereNotSystemUser = {
  firstName: {
    [Op.ne]: 'System',
  },
  lastName: { [Op.ne]: 'User' },
  email: { [Op.ne]: 'system-user@example.com' },
};

// Delete user with ID
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await deleteUserUtil(id, 'Admin Removal');

    // If the deleted count is 0, user not found
    if (!deleted) {
      return sendError(res, 'Error Removing User.', 404);
    }

    // User successfully deleted
    return sendSuccess(res, null, 'User deleted successfully');
  } catch (err) {
    logger.error('Delete user: ', err);
    return sendError(res, err);
  }
};

// Patch user with ID - not password
const updateBasicUserInfo = async (req, res) => {
  const t = await sequelize.transaction(); // Start a transaction

  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      registrationMethod,
      registrationStatus,
      verifiedUser,
    } = req.body;

    // Find existing user details within the transaction
    const existingUser = await User.findOne({ where: { id }, transaction: t });

    // If user not found
    if (!existingUser || checkIfSystemUser(existingUser)) {
      await t.rollback();
      return sendError(res, 'User not found', 404);
    }

    const changedInfo = [];

    if (firstName) {
      existingUser.firstName = firstName;
      changedInfo.push('firstName');
    }

    if (lastName) {
      existingUser.lastName = lastName;
      changedInfo.push('lastName');
    }

    if (registrationMethod) {
      existingUser.registrationMethod = registrationMethod;
    }

    if (registrationStatus) {
      existingUser.registrationStatus = registrationStatus;
    }

    if (verifiedUser !== undefined && verifiedUser !== null) {
      existingUser.verifiedUser = verifiedUser;
    }

    // If update payload is empty
    if (Object.keys(req.body).length === 0) {
      await t.rollback();
      return sendError(res, 'No update payload provided', 400);
    }

    // Save user with updated details within the transaction
    const updatedUser = await existingUser.save({ transaction: t });

    // Queue notification within the same transaction
    const readable_notification = `ACC_CNG_${moment().format(
      'YYYYMMDD_HHmmss_SSS'
    )}`;
    await NotificationQueue.create(
      {
        type: 'email',
        templateName: 'accountChange',
        notificationOrigin: 'User Management',
        deliveryType: 'immediate',
        metaData: {
          notificationId: readable_notification,
          recipientName: `${updatedUser.firstName} ${updatedUser.lastName}`,
          notificationOrigin: 'User Management',
          subject: 'Account Change',
          mainRecipients: [updatedUser.email],
          notificationDescription: 'Account Change',
          changedInfo,
        },
        createdBy: req.user.id,
      },
      { transaction: t }
    );

    // Commit the transaction
    await t.commit();

    return sendSuccess(res, updatedUser, 'User updated successfully');
  } catch (err) {
    // Rollback transaction if anything goes wrong
    await t.rollback();
    logger.error(`Update user: ${err.message}`);
    return sendError(res, err);
  }
};

// Get user by ID
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ where: { id } });

    if (!user || checkIfSystemUser(user)) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user, 'User retrieved successfully');
  } catch (err) {
    logger.error(`Get user: ${err.message}`);
    return sendError(res, err);
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: whereNotSystemUser,
      include: [
        { model: UserRole, as: 'roles' },
        { model: UserApplication, as: 'applications' },
      ],
      // descending order by date
      order: [['createdAt', 'DESC']],
    });
    return sendSuccess(res, users, 'Users retrieved successfully');
  } catch (err) {
    logger.error('Get all users: ', err);
    return sendError(res, err);
  }
};

//Update password - Ensure current password provided is correct
const changePassword = async (req, res) => {
  const t = await sequelize.transaction(); // Start transaction

  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Find existing user details
    const existingUser = await User.findOne({ where: { id }, transaction: t });

    if (!existingUser || checkIfSystemUser(existingUser)) {
      await t.rollback();
      return sendError(res, 'User not found', 404);
    }

    // Check if current password is correct
    if (!bcrypt.compareSync(currentPassword, existingUser.hash)) {
      await t.rollback();
      return sendError(res, 'Current password is incorrect', 400);
    }

    // Check for password security violations
    const errors = checkPasswordSecurityViolations({
      password: newPassword,
      user: existingUser,
    });

    if (errors.length > 0) {
      await t.rollback();
      return sendError(res, errors, 400);
    }

    // Update password
    const salt = bcrypt.genSaltSync(10);
    existingUser.hash = bcrypt.hashSync(newPassword, salt);

    // Set password expiry and previous passwords
    setPasswordExpiry(existingUser);
    await setPreviousPasswords(existingUser);

    // Save user with updated details
    await User.update(
      {
        hash: existingUser.hash,
        metaData: existingUser.metaData,
        passwordExpiresAt: existingUser.passwordExpiresAt,
        forcePasswordReset: existingUser.forcePasswordReset,
      },
      { where: { id }, transaction: t }
    );

    // Queue notification
    const readable_notification = `ACC_CNG_${moment().format(
      'YYYYMMDD_HHmmss_SSS'
    )}`;

    // TODO - send notification only after successful commit
    await NotificationQueue.create(
      {
        type: 'email',
        templateName: 'accountChange',
        notificationOrigin: 'User Management',
        deliveryType: 'immediate',
        metaData: {
          notificationId: readable_notification,
          recipientName: `${existingUser.firstName} ${existingUser.lastName}`,
          notificationOrigin: 'User Management',
          subject: 'Account Change',
          mainRecipients: [existingUser.email],
          notificationDescription: 'Account Change',
          changedInfo: ['password'],
        },
        createdBy: id,
      },
      { transaction: t }
    );

    // Invalidate all existing sessions for security
    await RefreshToken.destroy({ where: { userId: id }, transaction: t });

    // Generate new tokens for the current session
    const tokenId = crypto.randomUUID();
    const accessToken = generateAccessToken({
      id: existingUser.id,
      email: existingUser.email,
    });
    const refreshToken = generateRefreshToken({ tokenId });

    // Decode refresh token to get iat and exp
    const { iat, exp } = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    // Create new refresh token in database
    await RefreshToken.create(
      {
        id: tokenId,
        userId: existingUser.id,
        token: refreshToken,
        deviceInfo: { userAgent: req.headers['user-agent'] },
        metaData: {},
        iat: new Date(iat * 1000),
        exp: new Date(exp * 1000),
      },
      { transaction: t }
    );

    // Set new tokens in cookies BEFORE committing transaction
    // If this fails, transaction will rollback
    await setTokenCookie(res, accessToken, refreshToken);
    await generateAndSetCSRFToken(req, res, accessToken);

    // Commit transaction only after tokens are set successfully
    await t.commit();

    return sendSuccess(res, null, 'Password updated successfully');
  } catch (err) {
    await t.rollback(); // Rollback on failure
    logger.error(err);
    return sendError(res, err);
  }
};

// Bulk Delete users with IDs
const bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body;

    let deletedCount = 0;
    let idsCount = ids.length;
    // Loop through each user and delete
    for (let id of ids) {
      const deleted = await deleteUserUtil(id, 'Admin Removal');
      if (deleted) {
        deletedCount++;
      }
    }

    if (deletedCount !== idsCount) {
      return sendError(res, 'Some users could not be deleted', 207);
    }

    return sendSuccess(res, { deletedCount }, 'Users deleted successfully');
  } catch (err) {
    logger.error('Failed to bulk delete users: ', err);
    return sendError(res, err);
  }
};

// Bulk Update users with
const bulkUpdateUsers = async (req, res) => {
  try {
    const { users } = req.body;
    const errors = [];

    // Loop through each user and update the fields provided
    for (let user of users) {
      const { id } = user;
      try {
        const existing = await User.findOne({ where: { id } });

        if (!existing || checkIfSystemUser(existing)) {
          errors.push({ id, status: 404, message: 'User not found' });
          continue; // Skip to the next user
        }

        // Update fields provided
        for (let key in user) {
          if (key !== 'id') {
            existing[key] = user[key];
          }
        }

        // Save user with updated details
        await existing.save();
      } catch (err) {
        logger.error(`Bulk update ${id}: ${err.message}`);
        errors.push({ id, status: err.status || 500, message: err.message });
      }
    }

    if (errors.length > 0) {
      return sendError(res, 'Some users could not be updated', 207);
    }

    return sendSuccess(res, null, 'Users updated successfully');
  } catch (err) {
    logger.error('Failed to bulk update users: ', err);
    return sendError(res, err);
  }
};

// Update user roles
const updateUserRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    const creator = req.user.id;

    // Find existing user details
    const existingUser = await User.findOne({ where: { id } });

    // If user not found
    if (!existingUser || checkIfSystemUser(existingUser)) {
      return sendError(res, 'User not found', 404);
    }
    // Create id and role pair
    const userRoles = roles.map(role => ({
      userId: id,
      roleId: role,
      createdBy: creator,
    }));

    // Get all existing roles for a user
    const existingRoles = await UserRole.findAll({ where: { userId: id } });

    // Delete existing roles that are not in the new list
    const rolesToDelete = existingRoles.filter(
      role => !roles.includes(role.roleId)
    );
    await UserRole.destroy({
      where: { id: rolesToDelete.map(role => role.id) },
    });

    // Crete new roles that are not in the existing list
    const rolesToAdd = userRoles.filter(
      role => !existingRoles.map(role => role.roleId).includes(role.roleId)
    );
    const newRoles = await UserRole.bulkCreate(rolesToAdd);

    // Response
    return sendSuccess(res, newRoles, 'User roles updated successfully');
  } catch (err) {
    logger.error('Update user roles: ', err);
    return sendError(res, err);
  }
};

const updateUserApplications = async (req, res) => {
  try {
    // Get user applications by id
    const { user } = req;
    const { id: user_id } = req.params;
    const { applications } = req.body;

    // Find existing user details
    const existing = await UserApplication.findAll({ where: { user_id } });
    const existingApplications = existing.map(app => app.application_id);

    // Delete applications that are not in the new list
    const applicationsToDelete = existingApplications.filter(
      app => !applications.includes(app)
    );
    await UserApplication.destroy({
      where: { application_id: applicationsToDelete },
    });

    // Create new applications that are not in the existing list
    const applicationToCreate = applications.filter(
      app => !existingApplications.includes(app)
    );
    const applicationUserPair = applicationToCreate.map(app => ({
      user_id,
      application_id: app,
      createdBy: user.id,
    }));
    const newApplications =
      await UserApplication.bulkCreate(applicationUserPair);

    // Response
    return sendSuccess(
      res,
      newApplications,
      'User applications updated successfully'
    );
  } catch (err) {
    logger.error(`Update user applications: ${err.message}`);
    return sendError(res, err);
  }
};

// Create new user - User Created by Admin/Owner
const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      registrationMethod = 'traditional',
      registrationStatus = 'active',
      verifiedUser = true,
      roles,
      applications,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return sendError(res, 'Email already exists', 400);
    }

    // Generate random password - 12 characters - alpha numeric
    const password = generatePassword();

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      hash,
      registrationMethod,
      registrationStatus,
      verifiedUser,
      forcePasswordReset: true,
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
      },
    });

    // Create user roles
    const userRoles = roles.map(role => ({
      userId: newUser.id,
      roleId: role,
      createdBy: req.user.id,
    }));
    await UserRole.bulkCreate(userRoles);

    // Create user applications
    const userApplications = applications.map(application => ({
      user_id: newUser.id,
      application_id: application,
      createdBy: req.user.id,
    }));
    await UserApplication.bulkCreate(userApplications);

    // Refetch user information
    const newUserData = await User.findOne({
      where: { id: newUser.id },
      include: [
        { model: UserRole, as: 'roles' },
        { model: UserApplication, as: 'applications' },
      ],
    });

    // Searchable notification ID
    const searchableNotificationId = `USR_REG__${moment().format(
      'YYYYMMDD_HHmmss_SSS'
    )}`;
    const verificationCode = UUIDV4();

    // Create account verification code
    await AccountVerificationCode.create({
      code: verificationCode,
      userId: newUser.id,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Add to notification queue
    await NotificationQueue.create({
      type: 'email',
      templateName: 'completeRegistration',
      notificationOrigin: 'User Management',
      deliveryType: 'immediate',
      metaData: {
        notificationId: searchableNotificationId,
        recipientName: `${newUserData.firstName}`,
        registrationLink: `${trimURL(
          process.env.WEB_URL
        )}/reset-temporary-password/${verificationCode}`,
        tempPassword: password,
        notificationOrigin: 'User Management',
        subject: 'Complete your registration',
        mainRecipients: [newUserData.email],
        notificationDescription: 'Complete your Registration',
        validForHours: 24,
      },
      createdBy: req.user.id,
    });

    // Remove hash
    delete newUserData.dataValues.hash;

    return sendSuccess(res, newUserData, 'User created successfully', 201);
  } catch (err) {
    logger.error(`Create user: ${err.message}`);
    return sendError(res, err);
  }
};

// Reset password for user
const resetPasswordForUser = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start a transaction

  try {
    const { id } = req.body;

    // Get user by ID
    const user = await User.findOne({ where: { id }, transaction });

    // If user not found
    if (!user || checkIfSystemUser(user)) {
      await transaction.rollback(); // Rollback if user is not found
      return sendError(res, 'User not found', 404);
    }

    // Generate a password reset token
    const randomId = uuidv4();
    const passwordRestLink = `${trimURL(
      process.env.WEB_URL
    )}/reset-password/${randomId}`;

    // Searchable notification ID
    const searchableNotificationId = `USR_PWD_RST__${moment().format(
      'YYYYMMDD_HHmmss_SSS'
    )}`;

    // Queue notification
    await NotificationQueue.create(
      {
        type: 'email',
        templateName: 'resetPasswordLink',
        notificationOrigin: 'Reset Password',
        deliveryType: 'immediate',
        createdBy: 'System',
        updatedBy: 'System',
        metaData: {
          notificationId: searchableNotificationId,
          recipientName: `${user.firstName}`,
          notificationOrigin: 'Reset Password',
          subject: 'Password Reset Link',
          mainRecipients: [user.email],
          notificationDescription: 'Password Reset Link',
          validForHours: 24,
          passwordRestLink,
        },
      },
      { transaction }
    );

    // Save the password reset token to the user object in the database
    await PasswordResetLink.create(
      {
        id: randomId,
        userId: user.id,
        resetLink: passwordRestLink,
        issuedAt: new Date(),
        expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      },
      { transaction }
    );

    // Create account verification code
    await AccountVerificationCode.create(
      {
        code: randomId,
        userId: user.id,
        expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      },
      { transaction }
    );

    // Commit transaction if everything is successful
    await transaction.commit();

    // Response
    return sendSuccess(res, null, 'Password reset successfully');
  } catch (err) {
    await transaction.rollback(); // Rollback transaction in case of error
    logger.error(`Reset password for user: ${err.message}`);
    return sendError(res, err);
  }
};

// unlockAccount
const unlockAccount = async (req, res) => {
  try {
    // Get user by ID
    const { id } = req.body;
    const user = await User.findOne({ where: { id } });

    // If user not found
    if (!user || checkIfSystemUser(user)) {
      return sendError(res, 'User not found', 404);
    }

    user.loginAttempts = 0;
    user.accountLocked = { isLocked: false, lockedReason: [] };

    // Save user with updated details
    await user.save();

    // Response
    return sendSuccess(res, null, 'User account unlocked successfully');
  } catch (err) {
    logger.error(`Unlock account: ${err.message}`);
    return sendError(res, err);
  }
};

//Exports
module.exports = {
  createUser,
  deleteUser,
  updateBasicUserInfo,
  getUser,
  getAllUsers,
  changePassword,
  bulkDeleteUsers,
  bulkUpdateUsers,
  updateUserRoles,
  updateUserApplications,
  resetPasswordForUser,
  unlockAccount,
};
