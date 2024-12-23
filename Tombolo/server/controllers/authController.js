const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const logger = require("../config/logger");
const roleTypes = require("../config/roleTypes");
const models = require("../models");
const {
  generateAccessToken,
  generateRefreshToken,
  getAUser,
  setTokenCookie,
} = require("../utils/authUtil");
const { blacklistToken } = require("../utils/tokenBlackListing");

const { generateAndSetCSRFToken } = require("../utils/authUtil");

const User = models.user;
const UserRoles = models.UserRoles;
const user_application = models.user_application;
const Application = models.application;
const RoleTypes = models.RoleTypes;
const RefreshTokens = models.RefreshTokens;
const NotificationQueue = models.notification_queue;
const PasswordResetLinks = models.PasswordResetLinks;
const AccountVerificationCodes = models.AccountVerificationCodes;

// Register application owner
const createApplicationOwner = async (req, res) => {
  try {
    const { deviceInfo = {} } = req.body;
    const payload = req.body;

    // Find the role ID for the OWNER role type
    const role = await RoleTypes.findOne({
      where: { roleName: roleTypes.OWNER },
    });

    // If the OWNER role type is not found, return a 409 conflict response
    if (!role || !role.id) {
      return res.status(409).json({
        success: false,
        message: "Owner role not found in the system",
      });
    }

    // Check if a user with the OWNER role already exists
    const owner = await UserRoles.findOne({ where: { roleId: role.id } });

    // If an owner is found, return a 409 conflict response
    if (owner) {
      return res.status(409).json({
        success: false,
        message: "An owner already exists in the system",
      });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    payload.hash = bcrypt.hashSync(req.body.password, salt);

    // Save user to DB
    const user = await User.create(payload);

    // Save user role
    await UserRoles.create({
      userId: user.id,
      roleId: role.id,
      createdBy: user.id,
    });

    // Send verification email
    const searchableNotificationId = uuidv4();
    const verificationCode = uuidv4();

    // Create account verification code
    await AccountVerificationCodes.create({
      code: verificationCode,
      userId: user.id,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Add to notification queue
    await NotificationQueue.create({
      type: "email",
      templateName: "verifyEmail",
      notificationOrigin: "User Registration",
      deliveryType: "immediate",
      metaData: {
        notificationId: searchableNotificationId,
        recipientName: `${user.firstName}`,
        verificationLink: `${process.env.WEB_URL}/register?regId=${verificationCode}`,
        notificationOrigin: "User Registration",
        subject: "Verify your email",
        mainRecipients: [user.email],
        notificationDescription: "Verify email",
        validForHours: 24,
      },
      createdBy: user.id,
    });

    // Send response
    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (err) {
    logger.error(err);
    logger.error(`Create user: ${err.message}`);

    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Register basic user [ Self registration by user ]
const createBasicUser = async (req, res) => {
  try {
    const payload = req.body;

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    payload.hash = bcrypt.hashSync(req.body.password, salt);

    // Save user to DB
    const user = await User.create(payload);

    // Send verification email
    const searchableNotificationId = uuidv4();
    const verificationCode = uuidv4();

    // Create account verification code
    await AccountVerificationCodes.create({
      code: verificationCode,
      userId: user.id,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Add to notification queue
    await NotificationQueue.create({
      type: "email",
      templateName: "verifyEmail",
      notificationOrigin: "User Registration",
      deliveryType: "immediate",
      metaData: {
        notificationId: searchableNotificationId,
        recipientName: `${user.firstName}`,
        verificationLink: `${process.env.WEB_URL}/register?regId=${verificationCode}`,
        notificationOrigin: "User Registration",
        subject: "Verify your email",
        mainRecipients: [user.email],
        notificationDescription: "Verify email",
        validForHours: 24,
      },
      createdBy: user.id,
    });

    // Send response
    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (err) {
    logger.error(`Create user: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Find the account verification code
    const accountVerificationCode = await AccountVerificationCodes.findOne({
      where: { code: token },
    });

    // Token does not exist
    if (!accountVerificationCode) {
      logger.error(`Verify email: Token ${token} does not exist`);
      return res.status(404).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Token has expired
    if (new Date() > accountVerificationCode.expiresAt) {
      logger.error(`Verify email: Token ${token} has expired`);
      return res
        .status(400)
        .json({ success: false, message: "Verification token has expired" });
    }

    // Find the user
    const user = await User.findOne({
      where: { id: accountVerificationCode.userId },
      include: [
        {
          model: UserRoles,
          attributes: ["id"],
          as: "roles",
          include: [
            {
              model: RoleTypes,
              as: "role_details",
              attributes: ["id", "roleName"],
            },
          ],
        },
        {
          model: user_application,
          attributes: ["id"],
          as: "applications",
          include: [
            {
              model: Application,
              attributes: ["id", "title", "description"],
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
    await AccountVerificationCodes.destroy({
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
    await RefreshTokens.create({
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

    // Send response
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: { ...user.toJSON() },
    });
  } catch (err) {
    logger.error(`Verify email: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

//Reset Temp password
const resetPasswordWithToken = async (req, res) => {
  try {
    const { password, token, deviceInfo } = req.body;

    // From AccountVerificationCodes table findUser ID by code, where code is resetToken
    const accountVerificationCode = await AccountVerificationCodes.findOne({
      where: { code: token },
    });

    // If accountVerificationCode not found
    if (!accountVerificationCode) {
      throw { status: 404, message: "Invalid or expired reset token" };
    }

    // If accountVerificationCode has expired
    if (new Date() > accountVerificationCode.expiresAt) {
      throw { status: 400, message: "Reset token has expired" };
    }

    // Find user by ID
    let user = await getAUser({ id: accountVerificationCode.userId });

    // If user not found
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    // Hash the new password
    const salt = bcrypt.genSaltSync(10);
    user.hash = bcrypt.hashSync(password, salt);
    user.verifiedUser = true;
    user.verifiedAt = new Date();
    user.forcePasswordReset = false;

    // Save user with updated details
    await user.save();

    // Delete the account verification code
    await AccountVerificationCodes.destroy({
      where: { code: token },
    });

    //delete password reset link
    await PasswordResetLinks.destroy({
      where: { id: token },
    });

    //remove all sessions for user before initiating new session
    await RefreshTokens.destroy({
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
    await RefreshTokens.create({
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

    // User data obj to send to the client
    const userObj = {
      ...user.toJSON(),
    };

    // remove hash from user object
    delete userObj.hash;

    // Success response
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: userObj,
    });
  } catch (err) {
    logger.error(`Reset Temp Password: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

//Login Basic user
const loginBasicUser = async (req, res, next) => {
  try {
    const { email, password, deviceInfo } = req.body;

    const genericError = "Username and Password combination not found";

    // find user - include user roles from UserRoles table
    const user = await getAUser({ email });

    // User with the given email does not exist
    if (!user) {
      logger.error(`Login : User with email ${email} does not exist`);
      return res.status(401).json({
        success: false,
        message: genericError,
      });
    }

    // If not verified user return error
    if (!user.verifiedUser) {
      logger.error(`Login : Login attempt by unverified user - ${user.id}`);

      // Throw unverified user error
      const unverifiedUserErr = new Error(genericError);
      unverifiedUserErr.status = 403;
      throw unverifiedUserErr;
    }

    // If user is an registered to azure, throw error
    if (user.registrationMethod === "azure") {
      logger.error(
        `Login : Login attempt by azure user - ${user.id} - ${user.email}`
      );

      // Incorrect E-mail password combination error
      const azureError = new Error(
        "Email is registered with a Microsoft account. Please sign in with Microsoft"
      );
      azureError.status = 403;
      throw azureError;
    }
    //Compare password
    if (!bcrypt.compareSync(password, user.hash)) {
      logger.error(`Login : Invalid password for user with email ${email}`);

      // Incorrect E-mail password combination error
      const invalidCredentialsErr = new Error(genericError);
      invalidCredentialsErr.status = 403;
      throw invalidCredentialsErr;
    }

    // Remove hash from use object
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

    //get device info from request

    // Save refresh token in DB
    await RefreshTokens.create({
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

    // Success response
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: userObj,
    });
  } catch (err) {
    console.log(err);
    // If err.status is present - it is logged already
    if (!err.status) {
      logger.error(`Login user: ${err.message}`);
    }
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Logout Basic user
const logOutBasicUser = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie("token");
    res.clearCookie("x-csrf-token");
    // Decode the token to get the tokenId (assuming token contains tokenId)
    const decodedToken = jwt.decode(req.cookies.token);

    const { tokenId } = decodedToken;

    // Remove refresh token from the database
    await RefreshTokens.destroy({
      where: { id: tokenId },
    });

    // Add access token to the blacklist
    await blacklistToken({ tokenId, exp: decodedToken.exp });

    res.status(200).json({ success: true, message: "User logged out" });
  } catch (err) {
    logger.error(`Logout user: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Fulfill password reset request
const handlePasswordResetRequest = async (req, res) => {
  try {
    // Get user email
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // User with the given email does not exist
    if (!user) {
      logger.error(`Reset password: User with email ${email} does not exist`);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Stop users form abusing this endpoint - allow 4 requests per hour
    const passwordResetRequests = await PasswordResetLinks.findAll({
      where: {
        userId: user.id,
        issuedAt: {
          [models.Sequelize.Op.gte]: new Date(
            new Date().getTime() - 60 * 60 * 1000
          ),
        },
      },
    });

    // Max requests per hour
    if (passwordResetRequests.length >= 4) {
      logger.error(
        `Reset password: User with email ${email} has exceeded the limit of password reset requests`
      );
      return res
        .status(429)
        .json({ success: false, message: "Too many requests" });
    }

    // Generate a password reset token
    const randomId = uuidv4();
    let webUrl = process.env.WEB_URL;

    //cut off last character if it is a slash
    if (webUrl[webUrl.length - 1] === "/") {
      webUrl = webUrl.slice(0, -1);
    }

    const passwordRestLink = `${webUrl}/reset-password/${randomId}`;

    // Notification subject
    let subject = "Password Reset Link";
    if (process.env.INSTANCE_NAME) {
      subject = `${process.env.INSTANCE_NAME} - ${subject}`;
    }

    //include searchableNotificationId in the notification meta data
    const searchableNotificationId = uuidv4();

    // Queue notification
    await NotificationQueue.create({
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
        subject: "PasswordResetLink",
        mainRecipients: [user.email],
        notificationDescription: "Password Reset Link",
        validForHours: 24,
        passwordRestLink,
      },
    });

    // Save the password reset token to the user object in the database
    await PasswordResetLinks.create({
      id: randomId,
      userId: user.id,
      resetLink: passwordRestLink,
      issuedAt: new Date(),
      expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    });

    // Create account verification code
    await AccountVerificationCodes.create({
      code: randomId,
      userId: user.id,
      expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    });

    // response
    res.status(200).json({ success: true });
  } catch (err) {
    logger.error(`Reset password: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
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
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env.REDIRECT_URI,
      scope: "openid profile email",
    };

    // Construct the x-www-form-urlencoded string using a loop
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(paramsObj)) {
      params.append(key, value);
    }

    // Get access token from Azure
    const response = await axios.post(msEndPoint, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
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

    // Find user by email - includes user roles from UserRoles table
    const user = await getAUser({ email });

    // If user exists update userExists object
    if (user) {
      userExists.exists = true;
      userExists.registrationMethod = user.registrationMethod;
    }

    // If user exists and is not an azure user
    if (userExists.exists && userExists.registrationMethod !== "azure") {
      return res.status(409).json({
        success: false,
        message:
          "This account was created with a different login method. Please sign in with your username and password instead of using Microsoft",
      });
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
        registrationMethod: "azure",
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
      await RefreshTokens.create({
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

      // Send response
      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: { ...newUserPlain },
      });
    }

    // If user exists and is azure user
    // Create a new refresh token
    const tokenId = uuidv4();
    const refreshToken = generateRefreshToken({ tokenId });

    // Save refresh token to DB
    const { iat, exp } = jwt.decode(refreshToken);

    // Save refresh token in DB
    await RefreshTokens.create({
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

    // Send response
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: { ...user.toJSON() },
    });
  } catch (err) {
    console.log(err);
    logger.error(`Login or Register Azure User: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

//Exports
module.exports = {
  createBasicUser,
  verifyEmail,
  resetPasswordWithToken,
  loginBasicUser,
  logOutBasicUser,
  handlePasswordResetRequest,
  createApplicationOwner,
  loginOrRegisterAzureUser,
};
