// Imports from libraries
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { Op } = require('sequelize');
const moment = require('moment');

// Local imports
const logger = require('../config/logger');
const roleTypes = require('../config/roleTypes');
const { sendSuccess, sendError } = require('../utils/response');
const {
  User,
  UserRole,
  UserApplication,
  Application,
  RoleType,
  RefreshToken,
  NotificationQueue,
  PasswordResetLink,
  AccountVerificationCode,
  SentNotification,
  InstanceSetting,
  sequelize,
} = require('../models');
const {
  generateAccessToken,
  generateRefreshToken,
  getAUser,
  setTokenCookie,
  trimURL,
  setPasswordExpiry,
  setLastLoginAndReturn,
  sendPasswordExpiredEmail,
  checkPasswordSecurityViolations,
  generateAndSetCSRFToken,
  setPreviousPasswords,
  setLastLogin,
  handleInvalidLoginAttempt,
} = require('../utils/authUtil');
const { blacklistToken } = require('../utils/tokenBlackListing');

// Register application owner
const createApplicationOwner = async (req, res) => {
  try {
    const payload = req.body;

    // Find the role ID for the OWNER role type
    const role = await RoleType.findOne({
      where: { roleName: roleTypes.OWNER },
    });

    // If the OWNER role type is not found, return a 409 conflict response
    if (!role || !role.id) {
      return sendError(res, 'Owner role not found in the system', 409);
    }

    // Check if a user with the OWNER role already exists
    const owner = await UserRole.findOne({ where: { roleId: role.id } });

    // If an owner is found, return a 409 conflict response
    if (owner) {
      return sendError(res, 'An owner already exists in the system', 409);
    }

    // Check if the password meets the security requirements
    const passwordSecurityViolations = await checkPasswordSecurityViolations(
      {
        password: req.body.password,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      },
      payload,
      {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      },
      {
        newUser: true,
      }
    );

    if (passwordSecurityViolations.length > 0) {
      return sendError(
        res,
        'Password does not meet security requirements',
        400
      );
    } // Hash password and set expiry
    const salt = bcrypt.genSaltSync(10);
    payload.hash = bcrypt.hashSync(req.body.password, salt);
    setPasswordExpiry(payload);
    setPreviousPasswords(payload);
    setLastLoginAndReturn(payload);

    // Save user to DB
    const user = await User.create(payload);

    // Save user role
    await UserRole.create({
      userId: user.id,
      roleId: role.id,
      createdBy: user.id,
    });

    // Send verification email
    const searchableNotificationId = uuidv4();
    const verificationCode = uuidv4();

    // Create account verification code
    await AccountVerificationCode.create({
      code: verificationCode,
      userId: user.id,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Add to notification queue
    await NotificationQueue.create({
      type: 'email',
      templateName: 'verifyEmail',
      notificationOrigin: 'User Registration',
      deliveryType: 'immediate',
      metaData: {
        notificationId: searchableNotificationId,
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
    });

    // Send response
    return sendSuccess(res, null, 'User created successfully', 201);
  } catch (err) {
    logger.error(`Create user: ${err.message}`);
    return sendError(res, err);
  }
};

// Register basic user [ Self registration by user ]
const createBasicUser = async (req, res) => {
  try {
    const payload = req.body;

    // Check if the password meets the security requirements
    const passwordSecurityViolations = checkPasswordSecurityViolations({
      password: payload.password,
      user: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      newUser: true,
    });

    if (passwordSecurityViolations.length > 0) {
      return sendError(
        res,
        'Password does not meet security requirements',
        400
      );
    }

    // Hash password and set expiry
    const salt = bcrypt.genSaltSync(10);
    payload.hash = bcrypt.hashSync(req.body.password, salt);
    setPasswordExpiry(payload);
    setPreviousPasswords(payload);
    setLastLoginAndReturn(payload);

    // Save user to DB
    const user = await User.create(payload);

    // Send verification email
    const searchableNotificationId = uuidv4();
    const verificationCode = uuidv4();

    // Create account verification code
    await AccountVerificationCode.create({
      code: verificationCode,
      userId: user.id,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Add to notification queue
    await NotificationQueue.create({
      type: 'email',
      templateName: 'verifyEmail',
      notificationOrigin: 'User Registration',
      deliveryType: 'immediate',
      metaData: {
        notificationId: searchableNotificationId,
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
    });

    // Send response
    return sendSuccess(res, null, 'User created successfully', 201);
  } catch (err) {
    logger.error(`Create user: ${err.message}`);
    return sendError(res, err);
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Find the account verification code
    const accountVerificationCode = await AccountVerificationCode.findOne({
      where: { code: token },
    });

    // Token does not exist
    if (!accountVerificationCode) {
      logger.error(`Verify email: Token ${token} does not exist`);
      return sendError(res, 'Invalid or expired verification token', 404);
    }

    // Token has expired
    if (new Date() > accountVerificationCode.expiresAt) {
      logger.error(`Verify email: Token ${token} has expired`);
      return sendError(res, 'Verification token has expired', 400);
    }

    // Find the user
    const user = await User.findOne({
      where: { id: accountVerificationCode.userId },
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
      ],
    });

    // Update user
    user.verifiedUser = true;
    user.verifiedAt = new Date();

    // Save user
    await user.save();

    // Delete the account verification code
    await AccountVerificationCode.destroy({
      where: { code: token },
    });

    // Create token id
    const tokenId = uuidv4();

    // Create access jwt
    const accessToken = generateAccessToken({ ...user.toJSON(), tokenId });

    // Generate refresh token
    const refreshToken = generateRefreshToken({ tokenId });

    // Save refresh token to DB
    const { iat, exp } = jwt.decode(refreshToken);

    // Save refresh token in DB
    await RefreshToken.create({
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      deviceInfo: {},
      metaData: {},
      iat: new Date(iat * 1000),
      exp: new Date(exp * 1000),
    });

    await setTokenCookie(res, accessToken);

    await generateAndSetCSRFToken(req, res, accessToken);

    await setLastLogin(user);

    // Send response
    return sendSuccess(
      res,
      { ...user.toJSON() },
      'Email verified successfully'
    );
  } catch (err) {
    logger.error('Failed to verify email', err);
    return sendError(res, err);
  }
};

//Reset Password With Token - Self Requested
const resetPasswordWithToken = async (req, res) => {
  let transaction;
  try {
    const { password, token, deviceInfo } = req.body;

    // Validate inputs before starting transaction
    if (!password || !token) {
      throw { status: 400, message: 'Password and token are required' };
    }

    // Start transaction
    transaction = await sequelize.transaction();

    // From the AccountVerificationCode table findUser ID by code, where code is resetToken
    const accountVerificationCode = await AccountVerificationCode.findOne(
      {
        where: { code: token },
      },
      { transaction }
    );

    // If accountVerificationCode not found
    if (!accountVerificationCode) {
      throw { status: 404, message: 'User not found' };
    }

    const user = await User.findByPk(accountVerificationCode.userId, {
      transaction,
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // check if password meets security requirements
    const passwordSecurityViolations = checkPasswordSecurityViolations({
      password,
      user,
    });

    if (passwordSecurityViolations.length > 0) {
      return sendError(
        res,
        'Password does not meet security requirements',
        400
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and related fields
    await user.update(
      {
        password: hashedPassword,
        lastPasswordUpdate: new Date(),
        forcePasswordReset: false,
        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        metaData: {
          ...user.metaData,
          previousPasswords: [
            ...(user.metaData?.previousPasswords || []),
            user.password,
          ].slice(-5), // Keep last 5 passwords
        },
      },
      { transaction }
    );

    // Remove the account verification code
    await accountVerificationCode.destroy({ transaction });

    // Remove all password reset links for this user
    await PasswordResetLink.destroy({
      where: { userId: user.id },
      transaction,
    });

    // Create token id
    const tokenId = uuidv4();

    // Create access jwt
    const accessToken = generateAccessToken({ ...user.toJSON(), tokenId });

    // Generate refresh token
    const refreshToken = generateRefreshToken({ tokenId });

    // Save refresh token to DB
    const { iat, exp } = jwt.decode(refreshToken);

    // Save refresh token in DB
    await RefreshToken.create(
      {
        id: tokenId,
        userId: user.id,
        token: refreshToken,
        deviceInfo,
        metaData: {},
        iat: new Date(iat * 1000),
        exp: new Date(exp * 1000),
      },
      { transaction }
    );

    // Send notification informing user that password has been reset
    const readable_notification = `ACC_CNG_${moment().format(
      'YYYYMMDD_HHmmss_SSS'
    )}`;

    await NotificationQueue.create(
      {
        type: 'email',
        templateName: 'accountChange',
        notificationOrigin: 'Password Reset',
        deliveryType: 'immediate',
        metaData: {
          notificationId: readable_notification,
          recipientName: `${user.firstName} ${user.lastName}`,
          notificationOrigin: 'Password Reset',
          subject: 'Your password has been changed',
          mainRecipients: [user.email],
          notificationDescription: 'Password Reset',
          changedInfo: ['password'],
        },
        createdBy: user.id,
      },
      { transaction }
    );

    // Commit the transaction before setting cookies and tokens
    await transaction.commit();

    // User data obj to send to the client (after transaction commit)
    const userObj = {
      ...user.toJSON(),
    };

    // remove hash from user object
    delete userObj.hash;

    // Set cookies and tokens after successful transaction
    await setTokenCookie(res, accessToken);
    await generateAndSetCSRFToken(req, res, accessToken);

    // Set last login (outside transaction to avoid conflicts)
    await setLastLogin(user);

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: userObj,
    });
  } catch (err) {
    // Rollback the transaction if it exists
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        logger.error(`Transaction rollback failed: ${rollbackErr.message}`);
      }
    }
    logger.error(`Reset Password With Token: ${err.message}`);
    return res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

//Reset Password with Temp Password - Owner/Admin requested
const resetTempPassword = async (req, res) => {
  try {
    const { password, email, deviceInfo } = req.body;

    // Find user by ID
    let user = await getAUser({ email });

    // If user not found
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // check if password meets security requirements
    const passwordSecurityViolations = checkPasswordSecurityViolations({
      password,
      user,
    });

    if (passwordSecurityViolations.length > 0) {
      return sendError(
        res,
        'Password does not meet security requirements',
        400
      );
    }

    // Hash the new password and set expiry
    const salt = bcrypt.genSaltSync(10);
    user.hash = bcrypt.hashSync(password, salt);
    user.verifiedUser = true;
    user.verifiedAt = new Date();
    user.forcePasswordReset = false;
    setPasswordExpiry(user);
    setPreviousPasswords(user);
    setLastLoginAndReturn(user);

    // Save user with updated details
    await User.update(
      {
        hash: user.hash,
        metaData: user.metaData,
        passwordExpiresAt: user.passwordExpiresAt,
        forcePasswordReset: user.forcePasswordReset,
        lastLoginAt: user.lastLoginAt,
      },
      {
        where: { id: user.id },
      }
    );

    //remove all sessions for user before initiating new session
    await RefreshToken.destroy({
      where: { userId: user.id },
    });

    // Create token id
    const tokenId = uuidv4();

    // Create access jwt
    const accessToken = generateAccessToken({ ...user.toJSON(), tokenId });

    // Generate refresh token
    const refreshToken = generateRefreshToken({ tokenId });

    // Save refresh token to DB
    const { iat, exp } = jwt.decode(refreshToken);

    // Save refresh token in DB
    await RefreshToken.create({
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      deviceInfo,
      metaData: {},
      iat: new Date(iat * 1000),
      exp: new Date(exp * 1000),
    });

    await setTokenCookie(res, accessToken);

    await generateAndSetCSRFToken(req, res, accessToken);

    //set last login
    await setLastLogin(user);

    // User data obj to send to the client
    const userObj = {
      ...user.toJSON(),
    };

    // remove hash from user object
    delete userObj.hash;

    // Success response
    return sendSuccess(res, userObj, 'Password updated successfully');
  } catch (err) {
    logger.error(`Reset Temp Password: ${err.message}`);
    return sendError(res, err);
  }
};

//Login Basic user
// 401 - Unverified , Temp PW, Expired PW | 403 - Incorrect E-mail password combination | 500 - Internal server error | 200 - Success
//Login Basic user
// 401 - Invalid credentials | 403 - Account restrictions (unverified, temp pw, expired pw, locked) | 500 - Internal server error | 200 - Success
const loginBasicUser = async (req, res) => {
  try {
    const { email, password, deviceInfo } = req.body;

    const genericError = 'failed'; // Use Constants.LOGIN_FAILED

    // find user - include user roles from UserRole table
    const user = await getAUser({ email });

    // User with the given email does not exist
    if (!user) {
      logger.error(`Login : User with email ${email} does not exist`);
      return sendError(res, genericError, 401);
    }

    // If force password reset is true it means user is issued a temp password and must reset password
    if (user?.forcePasswordReset) {
      logger.error(`Login : Login attempt by user with Temp PW - ${user.id}`);
      return sendError(res, 'temp-pw', 401); // Use Constants.LOGIN_TEMP_PW
    }

    // If the accountLocked.isLocked is true, return generic error
    if (user.accountLocked.isLocked) {
      logger.error(
        `Login : Login Attempt by user with locked account ${email}`
      );
      return sendError(res, 'password-locked', 401);
    }

    //Compare password
    if (!bcrypt.compareSync(password, user.hash)) {
      logger.error(`Login : Invalid password for user with email ${email}`);
      await handleInvalidLoginAttempt({ user, errMessage: genericError });
      return; // Add missing return
    }

    // If not verified user return error
    if (!user.verifiedUser) {
      logger.error(`Login : Login attempt by unverified user - ${user.id}`);
      return sendError(res, 'unverified', 401); // Use Constants.LOGIN_UNVERIFIED
    }

    //if password has expired
    if (user.passwordExpiresAt <= new Date()) {
      logger.error(
        `Login : Login attempt by user with expired password - ${user.id}`
      );
      return sendError(res, 'password-expired', 401); // Use Constants.LOGIN_PW_EXPIRED
    }

    // If user is registered to azure, throw error
    if (user.registrationMethod === 'azure') {
      logger.error(
        `Login : Login attempt by azure user - ${user.id} - ${user.email}`
      );
      const azureError = new Error(
        'Email is registered with a Microsoft account. Please sign in with Microsoft'
      );
      azureError.status = 403;
      throw azureError;
    }

    // Remove hash from user object
    const userObj = user.toJSON();
    delete userObj.hash;

    // Create token id
    const tokenId = uuidv4();

    // Create access jwt
    const accessToken = generateAccessToken({ ...userObj, tokenId });

    // Generate refresh token
    const refreshToken = generateRefreshToken({ tokenId });

    // Save refresh token to DB
    const { iat, exp } = jwt.decode(refreshToken);

    // Save refresh token in DB
    await RefreshToken.create({
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      deviceInfo,
      metaData: {},
      iat: new Date(iat * 1000),
      exp: new Date(exp * 1000),
    });

    //set cookies
    await setTokenCookie(res, accessToken);
    await generateAndSetCSRFToken(req, res, accessToken);

    //set last login
    await setLastLogin(user);

    // Success response
    return sendSuccess(res, userObj, 'success'); // Use Constants.LOGIN_SUCCESS
  } catch (err) {
    logger.error(`Login user: ${err.message}`);
    if (!err.status) {
      logger.error(`Login user: ${err.message}`);
    }
    return sendError(res, err);
  }
};

// Logout Basic user
const logOutBasicUser = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token');
    res.clearCookie('x-csrf-token');
    // Decode the token to get the tokenId (assuming token contains tokenId)
    const decodedToken = jwt.decode(req.cookies.token);

    const { tokenId } = decodedToken;

    // Remove refresh token from the database
    await RefreshToken.destroy({
      where: { id: tokenId },
    });

    // Add access token to the blacklist
    await blacklistToken({ tokenId, exp: decodedToken.exp });

    return sendSuccess(res, null, 'User logged out');
  } catch (err) {
    logger.error(`Logout user: ${err.message}`);
    return sendError(res, err);
  }
};

// Fulfill password reset request - Self Requested
const handlePasswordResetRequest = async (req, res) => {
  try {
    // Get user email
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({
      where: { email },
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

    // User with the given email does not exist
    if (!user) {
      logger.error(`Reset password: User with email ${email} does not exist`);
      return sendError(res, 'User not found', 404);
    }

    //need to check if user is an owner or admin to see if they are allowed to reset password without admin assistance
    const isOwnerOrAdmin = user.roles.some(
      role =>
        role.role_details.roleName === roleTypes.OWNER ||
        role.role_details.roleName === roleTypes.ADMIN
    );

    //check if users password is expired
    if (
      (user.passwordExpiresAt < new Date() || user.forcePasswordReset) &&
      !isOwnerOrAdmin
    ) {
      logger.error(
        `Reset password: User with email ${email} has an expired password`
      );
      //send password expired email
      await sendPasswordExpiredEmail(user);

      return sendError(res, 'Password expired', 403);
    }

    // Stop users form abusing this endpoint - allow 4 requests per hour
    const passwordResetRequests = await PasswordResetLink.findAll({
      where: {
        userId: user.id,
        issuedAt: {
          [Op.gte]: new Date(new Date().getTime() - 60 * 60 * 1000),
        },
      },
    });

    // Max requests per hour
    if (passwordResetRequests.length >= 4) {
      logger.error(
        `Reset password: User with email ${email} has exceeded the limit of password reset requests`
      );
      return sendError(res, 'Too many requests', 429);
    }

    // Generate a password reset token
    const randomId = uuidv4();

    const passwordRestLink = `${trimURL(
      process.env.WEB_URL
    )}/reset-password/${randomId}`;

    // Notification subject
    let subject = 'Tombolo Password Reset Link';
    if (process.env.INSTANCE_NAME) {
      subject = `${process.env.INSTANCE_NAME} - ${subject}`;
    }

    //include searchableNotificationId in the notification meta data
    const searchableNotificationId = uuidv4();

    // Queue notification
    await NotificationQueue.create({
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
        subject,
        mainRecipients: [user.email],
        notificationDescription: 'Password Reset Link',
        validForHours: 24,
        passwordRestLink,
      },
    });

    // Save the password reset token to the user object in the database
    await PasswordResetLink.create({
      id: randomId,
      userId: user.id,
      resetLink: passwordRestLink,
      issuedAt: new Date(),
      expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    });

    // Create account verification code
    await AccountVerificationCode.create({
      code: randomId,
      userId: user.id,
      expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    });

    // response
    return sendSuccess(res, null, 'Password reset request processed');
  } catch (err) {
    logger.error(`Reset password: ${err.message}`);
    return sendError(res, err);
  }
};

// Login or register with azure user - loginOrRegisterAzureUser [ `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`]
const loginOrRegisterAzureUser = async (req, res, next) => {
  try {
    const msEndPoint = `https://login.microsoftonline.com/${process.env.TENENT_ID}/oauth2/v2.0/token`;

    const { code } = req.body;

    // Parameters to be appended
    const paramsObj = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.REDIRECT_URI,
      scope: 'openid profile email',
    };

    // Construct the x-www-form-urlencoded string using a loop
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(paramsObj)) {
      params.append(key, value);
    }

    // Get access token from Azure
    const response = await axios.post(msEndPoint, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Get user info from azure
    const { access_token: azureAccessToken, id_token } = response.data;

    // Decode ID token
    const decodedIdToken = jwt.decode(id_token);
    const { email } = decodedIdToken;

    // Check if user exists in the db
    const userExists = {
      exists: false,
      registrationMethod: null,
    };

    // Find user by email - includes user roles from UserRole table
    const user = await getAUser({ email });

    // If user exists update userExists object
    if (user) {
      userExists.exists = true;
      userExists.registrationMethod = user.registrationMethod;
    }

    // If user exists and is not an azure user
    if (userExists.exists && userExists.registrationMethod !== 'azure') {
      return sendError(
        res,
        'This account was created with a different login method. Please sign in with your username and password instead of using Microsoft',
        409
      );
    }

    // If user does not exist create user - issues necessary tokens etc just like registering  traditional user
    if (!userExists.exists) {
      // Decode access token and get fist and last name
      const decodedAccessToken = jwt.decode(azureAccessToken);
      const { given_name, family_name } = decodedAccessToken;

      // Create a new user
      const newUser = await User.create({
        email,
        firstName: given_name,
        lastName: family_name,
        registrationMethod: 'azure',
        verifiedUser: true,
        verifiedAt: new Date(),
      });

      const newUserPlain = newUser.toJSON();
      newUserPlain.roles = [];
      newUserPlain.applications = [];

      // Create a new refresh token
      const tokenId = uuidv4();
      const refreshToken = generateRefreshToken({ tokenId });

      // Save refresh token to DB
      const { iat, exp } = jwt.decode(refreshToken);

      // Save refresh token in DB
      await RefreshToken.create({
        id: tokenId,
        userId: newUserPlain.id,
        token: refreshToken,
        deviceInfo: {},
        metaData: {},
        iat: new Date(iat * 1000),
        exp: new Date(exp * 1000),
      });

      // Create a new access token
      const accessToken = generateAccessToken({ ...newUserPlain, tokenId });

      await setTokenCookie(res, accessToken);

      await generateAndSetCSRFToken(req, res, accessToken, next);

      // Set last login
      await setLastLogin(newUser);

      // Send response
      return sendSuccess(
        res,
        { ...newUserPlain },
        'User created successfully',
        201
      );
    }

    // If user exists and is azure user
    // Create a new refresh token
    const tokenId = uuidv4();
    const refreshToken = generateRefreshToken({ tokenId });

    // Save refresh token to DB
    const { iat, exp } = jwt.decode(refreshToken);

    // Save refresh token in DB
    await RefreshToken.create({
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      deviceInfo: {},
      metaData: {},
      iat: new Date(iat * 1000),
      exp: new Date(exp * 1000),
    });

    // Create a new access token
    const accessToken = generateAccessToken({ ...user.toJSON(), tokenId });

    await setTokenCookie(res, accessToken);

    await generateAndSetCSRFToken(req, res, accessToken);

    // Set last login
    await setLastLogin(user);

    // Send response
    return sendSuccess(
      res,
      { ...user.toJSON() },
      'User logged in successfully'
    );
  } catch (err) {
    logger.error(`Login or Register Azure User: ${err.message}`);
    return sendError(res, err);
  }
};

const requestAccess = async (req, res) => {
  try {
    const { id, comment } = req.body;

    const user = await User.findOne({ where: { id } });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const instance_setting = await InstanceSetting.findOne({ raw: true });

    if (!instance_setting) {
      return sendError(res, 'No contact email found', 404);
    }

    const existingNotification = await SentNotification.findOne({
      where: { notificationTitle: `User Access Request from ${user.email}` },
    });

    //check if existingNotification.createdAt is within 24 hours
    if (existingNotification) {
      const currentTime = new Date();
      const notificationTime = new Date(existingNotification.createdAt);
      const diff = Math.abs(currentTime - notificationTime);
      const diffHours = Math.ceil(diff / (1000 * 60 * 60));

      if (diffHours < 24) {
        logger.info(
          'Access request from user already sent within 24 hours. User: ' +
            user.email
        );
        return sendSuccess(res, null, 'Access request already sent');
      }
    }

    const { metaData } = instance_setting;
    let recipients = metaData?.accessRequestEmailRecipientsEmail || [];

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

      const roleIds = roleDetails.map(r => {
        return r.id;
      });

      // Get all users with the roleIds above
      const users = await UserRole.findAll({
        where: { roleId: roleIds },
        include: [
          {
            model: User, // or just User if it's in scope
            as: 'user', // This matches the alias in your association
            attributes: ['email'],
          },
        ],
      });

      const emails = users.map(u => u.user.email);
      recipients = [...recipients, ...emails];
    }

    const searchableNotificationId = uuidv4();

    // Add to notification queue
    await NotificationQueue.create({
      type: 'email',
      templateName: 'accessRequest',
      notificationOrigin: 'No Access Page',
      deliveryType: 'immediate',
      metaData: {
        notificationId: searchableNotificationId,
        notificationOrigin: 'No Access Page',
        email: `${user.email}`,
        comment: comment,
        userManagementLink: `${trimURL(
          process.env.WEB_URL
        )}/admin/userManagement`,
        subject: `User Access Request from ${user.email}`,
        mainRecipients: recipients,
        notificationDescription: 'User Access Request',
        validForHours: 24,
      },
      createdBy: user.id,
    });

    return sendSuccess(res, null, 'Access requested successfully');
  } catch (e) {
    logger.error(`Request Access: ${e.message}`);
    return sendError(res, e);
  }
};

// Resend verification code - user provides email
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Check if the verification code is there, if so delete it
    const existingCode = await AccountVerificationCode.findOne({
      where: { userId: user.id },
    });

    if (existingCode) {
      await existingCode.destroy();
    }

    // If the code was created in last 90 seconds, throw an error
    if (user.lastVerificationCodeSentAt > Date.now() - 90000) {
      throw {
        status: 429,
        message: 'Please wait 90 seconds before requesting a new code',
      };
    }

    // Send verification email
    const searchableNotificationId = uuidv4();
    const verificationCode = uuidv4();

    // Create account verification code
    await AccountVerificationCode.create({
      code: verificationCode,
      userId: user.id,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Add to notification queue
    await NotificationQueue.create({
      type: 'email',
      templateName: 'verifyEmail',
      notificationOrigin: 'User Registration',
      deliveryType: 'immediate',
      metaData: {
        notificationId: searchableNotificationId,
        recipientName: `${user.firstName}`,
        verificationLink: `${process.env.WEB_URL}/register?regId=${verificationCode}`,
        notificationOrigin: 'User Registration',
        subject: 'Verify your email',
        mainRecipients: [user.email],
        notificationDescription: 'Verify email',
        validForHours: 24,
      },
      createdBy: user.id,
    });

    // Update last verification code sent timestamp
    await user.update({ lastVerificationCodeSentAt: Date.now() });

    return sendSuccess(res, null, 'Verification code sent successfully');
  } catch (err) {
    logger.error(`Resend verification code: ${err.message}`);
    return sendError(res, err);
  }
};

const getUserDetailsWithToken = async (req, res) => {
  try {
    const { token } = req.params;

    //get the user id by the password reset link
    const userId = await PasswordResetLink.findOne({
      where: { id: token },

      attributes: ['userId'],
    });

    if (!userId) {
      return sendError(res, 'User not found', 404);
    }

    const id = userId.userId;

    const user = await User.findOne({
      where: { id: id },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    //only grab the details we need
    const userObj = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      metaData: user.metaData,
      newUser: user.newUser,
    };

    return sendSuccess(res, { user: userObj });
  } catch (err) {
    logger.error(`getUserDetailsWithToken: ${err.message}`);
    return sendError(res, err);
  }
};

const getUserDetailsWithVerificationCode = async (req, res) => {
  try {
    const { token } = req.params;

    //get the user id by the password reset link
    const userId = await AccountVerificationCode.findOne({
      where: { code: token },

      attributes: ['userId'],
    });

    if (!userId) {
      return sendError(res, 'User not found', 404);
    }

    const id = userId.userId;

    const user = await User.findOne({
      where: { id: id },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    //check if it is a new user
    if (
      !user.metaData?.previousPasswords ||
      user.metaData?.previousPasswords.length === 0
    ) {
      user.newUser = true;
    } else {
      user.newUser = false;
    }

    //only grab the details we need
    const userObj = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      metaData: user.metaData,
      newUser: user.newUser,
    };

    return sendSuccess(res, { user: userObj });
  } catch (err) {
    logger.error(`getUserDetailsWithVerificationCode: ${err.message}`);
    return sendError(res, err);
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Send E-mail to access request email
    const response = await sendPasswordExpiredEmail(user);

    return sendSuccess(res, null, response.message);
  } catch (err) {
    logger.error(`Request password reset: ${err.message}`);
    return sendError(res, err);
  }
};

//Exports
module.exports = {
  createBasicUser,
  verifyEmail,
  resetPasswordWithToken,
  resetTempPassword,
  loginBasicUser,
  logOutBasicUser,
  handlePasswordResetRequest,
  createApplicationOwner,
  loginOrRegisterAzureUser,
  requestAccess,
  resendVerificationCode,
  getUserDetailsWithToken,
  getUserDetailsWithVerificationCode,
  requestPasswordReset,
};
