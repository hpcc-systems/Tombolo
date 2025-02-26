// Imports from node modules
const { v4: UUIDV4 } = require("uuid");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../models").sequelize;

// Local imports
const logger = require("../config/logger");
const models = require("../models");
const {
  setPasswordExpiry,
  trimURL,
  checkPasswordSecurityViolations,
  setPreviousPasswords,
  generatePassword,
  sendAccountUnlockedEmail,
  deleteUser: deleteUserUtil,
} = require("../utils/authUtil");

// Constants
const User = models.user;
const UserRoles = models.UserRoles;
const user_application = models.user_application;
const NotificationQueue = models.notification_queue;
const AccountVerificationCodes = models.AccountVerificationCodes;
const PasswordResetLinks = models.PasswordResetLinks;

// Delete user with ID
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await deleteUserUtil(id, "Admin Removal");

    // If deleted count is 0, user not found
    if (!deleted) {
      throw { status: 404, message: "Error Removing User." };
    }

    // User successfully deleted
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    logger.error(`Delete user: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
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
    if (!existingUser) {
      throw { status: 404, message: "User not found" };
    }

    const changedInfo = [];

    if (firstName) {
      existingUser.firstName = firstName;
      changedInfo.push("firstName");
    }

    if (lastName) {
      existingUser.lastName = lastName;
      changedInfo.push("lastName");
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
      throw { status: 400, message: "No update payload provided" };
    }

    // Save user with updated details within the transaction
    const updatedUser = await existingUser.save({ transaction: t });

    // Queue notification within the same transaction
    const readable_notification = `ACC_CNG_${moment().format(
      "YYYYMMDD_HHmmss_SSS"
    )}`;
    await NotificationQueue.create(
      {
        type: "email",
        templateName: "accountChange",
        notificationOrigin: "User Management",
        deliveryType: "immediate",
        metaData: {
          notificationId: readable_notification,
          recipientName: `${updatedUser.firstName} ${updatedUser.lastName}`,
          notificationOrigin: "User Management",
          subject: "Account Change",
          mainRecipients: [updatedUser.email],
          notificationDescription: "Account Change",
          changedInfo,
        },
        createdBy: req.user.id,
      },
      { transaction: t }
    );

    // Commit the transaction
    await t.commit();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    // Rollback transaction if anything goes wrong
    await t.rollback();
    logger.error(`Update user: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Get user by ID
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ where: { id } });

    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (err) {
    logger.error(`Get user: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        { model: UserRoles, as: "roles" },
        { model: user_application, as: "applications" },
      ],
      // descending order by date
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (err) {
    logger.error(`Get all users: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
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

    if (!existingUser) {
      throw { status: 404, message: "User not found" };
    }

    // Check if current password is correct
    if (!bcrypt.compareSync(currentPassword, existingUser.hash)) {
      throw { status: 400, message: "Current password is incorrect" };
    }

    // Check for password security violations
    const errors = checkPasswordSecurityViolations({
      password: newPassword,
      user: existingUser,
    });

    if (errors.length > 0) {
      throw { status: 400, message: errors };
    }

    // Update password
    const salt = bcrypt.genSaltSync(10);
    existingUser.hash = bcrypt.hashSync(newPassword, salt);

    // Set password expiry and previous passwords
    setPasswordExpiry(existingUser);
    setPreviousPasswords(existingUser);

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
      "YYYYMMDD_HHmmss_SSS"
    )}`;
    await NotificationQueue.create(
      {
        type: "email",
        templateName: "accountChange",
        notificationOrigin: "User Management",
        deliveryType: "immediate",
        metaData: {
          notificationId: readable_notification,
          recipientName: `${existingUser.firstName} ${existingUser.lastName}`,
          notificationOrigin: "User Management",
          subject: "Account Change",
          mainRecipients: [existingUser.email],
          notificationDescription: "Account Change",
          changedInfo: ["password"],
        },
        createdBy: req.user.id,
      },
      { transaction: t }
    );

    // Commit transaction
    await t.commit();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    await t.rollback(); // Rollback on failure
    logger.error(`Change password: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
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
      const deleted = await deleteUserUtil(id, "Admin Removal");
      if (deleted) {
        deletedCount++;
      }
    }

    if (deletedCount !== idsCount) {
      res.status(207).json({
        success: false,
        message: "Some users could not be deleted",
        data: { deletedCount, idsCount },
      });
    }

    res.status(200).json({
      success: true,
      message: "Users deleted successfully",
      data: { deletedCount },
    });
  } catch (err) {
    logger.error(`Bulk Delete Users: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
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

        if (!existing) {
          errors.push({ id, status: 404, message: "User not found" });
          continue; // Skip to the next user
        }

        // Update fields provided
        for (let key in user) {
          if (key !== "id") {
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
      res.status(207).json({
        success: false,
        message: "Some users could not be updated",
        errors,
      });
    } else {
      res
        .status(200)
        .json({ success: true, message: "Users updated successfully" });
    }
  } catch (err) {
    logger.error(`Bulk update users: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
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
    if (!existingUser) {
      throw { status: 404, message: "User not found" };
    }
    // Create id and role pair
    const userRoles = roles.map((role) => ({
      userId: id,
      roleId: role,
      createdBy: creator,
    }));

    // Get all existing roles for a user
    const existingRoles = await UserRoles.findAll({ where: { userId: id } });

    // Delete existing roles that are not in the new list
    const rolesToDelete = existingRoles.filter(
      (role) => !roles.includes(role.roleId)
    );
    await UserRoles.destroy({
      where: { id: rolesToDelete.map((role) => role.id) },
    });

    // Crete new roles that are not in the existing list
    const rolesToAdd = userRoles.filter(
      (role) => !existingRoles.map((role) => role.roleId).includes(role.roleId)
    );
    const newRoles = await UserRoles.bulkCreate(rolesToAdd);

    // Response
    res.status(200).json({
      success: true,
      message: "User roles updated successfully",
      data: newRoles,
    });
  } catch (err) {
    console.log(err);
    logger.error(`Update user roles: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

const updateUserApplications = async (req, res) => {
  try {
    // Get user applications by id
    const { user } = req;
    const { id: user_id } = req.params;
    const { applications } = req.body;

    // Find existing user details
    const existing = await user_application.findAll({ where: { user_id } });
    const existingApplications = existing.map((app) => app.application_id);

    // Delete applications  that are not in the new list
    const applicationsToDelete = existingApplications.filter(
      (app) => !applications.includes(app)
    );
    await user_application.destroy({
      where: { application_id: applicationsToDelete },
    });

    // Create new applications that are not in the existing list
    const applicationToCreate = applications.filter(
      (app) => !existingApplications.includes(app)
    );
    const applicationUserPair = applicationToCreate.map((app) => ({
      user_id,
      application_id: app,
      createdBy: user.id,
    }));
    const newApplications = await user_application.bulkCreate(
      applicationUserPair
    );

    // Response
    res.status(200).json({
      success: true,
      message: "User applications updated successfully",
      data: newApplications,
    });
  } catch {
    logger.error(`Update user applications: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Create new user - User Created by Admin/Owner
const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      registrationMethod = "traditional",
      registrationStatus = "active",
      verifiedUser = false,
      roles,
      applications,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      throw { status: 400, message: "Email already exists" };
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
    const userRoles = roles.map((role) => ({
      userId: newUser.id,
      roleId: role,
      createdBy: req.user.id,
    }));
    await UserRoles.bulkCreate(userRoles);

    // Create user applications
    const userApplications = applications.map((application) => ({
      user_id: newUser.id,
      application_id: application,
      createdBy: req.user.id,
    }));
    await user_application.bulkCreate(userApplications);

    // Refetch user information
    const newUserData = await User.findOne({
      where: { id: newUser.id },
      include: [
        { model: UserRoles, as: "roles" },
        { model: user_application, as: "applications" },
      ],
    });

    // Searchable notification ID
    const searchableNotificationId = `USR_REG__${moment().format(
      "YYYYMMDD_HHmmss_SSS"
    )}`;
    const verificationCode = UUIDV4();

    // Create account verification code
    await AccountVerificationCodes.create({
      code: verificationCode,
      userId: newUser.id,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Add to notification queue
    await NotificationQueue.create({
      type: "email",
      templateName: "completeRegistration",
      notificationOrigin: "User Management",
      deliveryType: "immediate",
      metaData: {
        notificationId: searchableNotificationId,
        recipientName: `${newUserData.firstName}`,
        registrationLink: `${trimURL(
          process.env.WEB_URL
        )}/reset-temporary-password/${verificationCode}`,
        tempPassword: password,
        notificationOrigin: "User Management",
        subject: "Complete your registration",
        mainRecipients: [newUserData.email],
        notificationDescription: "Complete your Registration",
        validForHours: 24,
      },
      createdBy: req.user.id,
    });

    // Remove hash
    delete newUserData.dataValues.hash;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUserData,
    });
  } catch (err) {
    logger.error(`Create user: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
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
    if (!user) {
      await transaction.rollback(); // Rollback if user is not found
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate a password reset token
    const randomId = uuidv4();
    const passwordRestLink = `${trimURL(
      process.env.WEB_URL
    )}/reset-password/${randomId}`;

    // Searchable notification ID
    const searchableNotificationId = `USR_PWD_RST__${moment().format(
      "YYYYMMDD_HHmmss_SSS"
    )}`;

    // Queue notification
    await NotificationQueue.create(
      {
        type: "email",
        templateName: "resetPasswordLink",
        notificationOrigin: "Reset Password",
        deliveryType: "immediate",
        createdBy: "System",
        updatedBy: "System",
        metaData: {
          notificationId: searchableNotificationId,
          recipientName: `${user.firstName}`,
          notificationOrigin: "Reset Password",
          subject: "Password Reset Link",
          mainRecipients: [user.email],
          notificationDescription: "Password Reset Link",
          validForHours: 24,
          passwordRestLink,
        },
      },
      { transaction }
    );

    // Save the password reset token to the user object in the database
    await PasswordResetLinks.create(
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
    await AccountVerificationCodes.create(
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
    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    await transaction.rollback(); // Rollback transaction in case of error
    logger.error(`Reset password for user: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// unlockAccount
const unlockAccount = async (req, res) => {
  try {
    // Get user by ID
    const { id } = req.body;
    const user = await User.findOne({ where: { id } });

    // If user not found
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate temporary password/hash
    const tempPassword = generatePassword();
    const salt = bcrypt.genSaltSync(10);

    // Add updated user details
    user.hash = bcrypt.hashSync(tempPassword, salt);
    user.forcePasswordReset = true;
    user.passwordExpiresAt = new Date(
      new Date().setDate(new Date().getDate() + 2) // 48 hours
    );
    user.loginAttempts = 0;
    user.accountLocked = {isLocked : false,lockedReason: []};

    // Save user with updated details
    await user.save();

    // Send notification to the user
      const verificationCode = UUIDV4();

    // Create account verification code
    await AccountVerificationCodes.create({
      code: verificationCode,
      userId: user.id,
      expiresAt: new Date(Date.now() + 172800000),
    });

    await sendAccountUnlockedEmail({ user, tempPassword, verificationCode });

    // Response
    res.status(200).json({ success: true, message: "User account unlocked successfully" });
  } catch (err) {
    logger.error(`Unlock account: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
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
