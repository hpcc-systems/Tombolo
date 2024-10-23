const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const logger = require("../config/logger");
const roleTypes = require("../config/roleTypes");
const models = require("../models");
const {
  generateAccessToken,
  generateRefreshToken,
  getAUser,
} = require("../utils/authUtil");
const { blacklistToken } = require("../utils/tokenBlackListing");

const User = models.user;
const UserRoles = models.UserRoles;
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

    // Remove hash from user object
    const userObj = user.toJSON();
    delete userObj.hash;

    // Create token id
    const tokenId = uuidv4();

    // Create access jwt
    const accessToken = generateAccessToken({ ...userObj, tokenId });
    userObj.token = `Bearer ${accessToken}`;

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

    // Save user role
    await UserRoles.create({
      userId: user.id,
      roleId: role.id,
      createdBy: user.id,
    });

    // Send response
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { ...userObj, UserRoles: [{ role_details: role }] },
    });
  } catch (err) {
    logger.error(err);
    logger.error(`Create user: ${err.message}`);

    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Register basic user
const createBasicUser = async (req, res) => {
  try {
    const { deviceInfo = {} } = req.body;
    const payload = req.body;

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    payload.hash = bcrypt.hashSync(req.body.password, salt);

    // Save user to DB
    const user = await User.create(payload);

    // remove hash from user object
    const userObj = user.toJSON();
    delete userObj.hash;

    // Create token id
    const tokenId = uuidv4();

    // Create access jwt
    const accessToken = generateAccessToken({ ...userObj, tokenId });
    userObj.token = `Bearer ${accessToken}`;

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

    // Send response
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { ...userObj, UserRoles: [] },
    });
  } catch (err) {
    logger.error(err);
    logger.error(`Create user: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

//Reset Temp password
const resetTempPassword = async (req, res) => {
  try {
    const { tempPassword, password, token, deviceInfo } = req.body;

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

    // Compare temp password with hash.
    if (!bcrypt.compareSync(tempPassword, user.hash)) {
      throw { status: 500, message: "Invalid temporary password" };
    }

    // Hash the new password
    const salt = bcrypt.genSaltSync(10);
    user.hash = bcrypt.hashSync(password, salt);
    user.verified = true;
    user.verifiedAt = new Date();
    user.forcePasswordReset = false;

    // Save user with updated details
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
      deviceInfo,
      metaData: {},
      iat: new Date(iat * 1000),
      exp: new Date(exp * 1000),
    });

    // User data obj to send to the client
    const userObj = {
      ...user.toJSON(),
      token: `Bearer ${accessToken}`,
    }

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
const loginBasicUser = async (req, res) => {
  try {
    const { email, password, deviceInfo } = req.body;

    // find user - include user roles from UserRoles table
   const user = await getAUser({ email });

    // User with the given email does not exist
    if (!user) {
      logger.error(`Login : User with email ${email} does not exist`);
      return res.status(404).json({
        success: false,
        message: "Username and Password combination not found",
      });
    }

    //Compare password
    if (!bcrypt.compareSync(password, user.hash)) {
      logger.error(`Login : Invalid password for user with email ${email}`);
      return res.status(401).json({
        success: false,
        message: "Username and Password combination not found",
      });
    }

    // Remove hash from use object
    const userObj = user.toJSON();
    delete userObj.hash;

    // Create token id
    const tokenId = uuidv4();

    // Create access jwt
    const accessToken = generateAccessToken({ ...userObj, tokenId });
    userObj.token = `Bearer ${accessToken}`;

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

    // Success response
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: userObj,
    });
  } catch (err) {
    logger.error(`Login user: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Logout Basic user
const logOutBasicUser = async (req, res) => {
  try {
    // Decode the token to get the tokenId (assuming token contains tokenId)
    const decodedToken = jwt.decode(req.accessToken);

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
    const passwordRestLink = `${process.env.WEB_URL}/reset-password/${randomId}`;

    // Notification subject
    let subject = "Password Reset Link";
    if (process.env.INSTANCE_NAME) {
      subject = `${process.env.INSTANCE_NAME} - ${subject}`;
    }

    // Queue notification
    await NotificationQueue.create({
      type: "email",
      templateName: "resetPasswordLink",
      notificationOrigin: "Reset Password",
      deliveryType: "immediate",
      createdBy: "System",
      updatedBy: "System",
      metaData: {
        mainRecipients: [email],
        subject,
        body: "Password reset link",
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

    // response
    res.status(200).json({ success: true });
  } catch (err) {
    logger.error(`Reset password: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    // Get the password reset token
    const { token, password } = req.body;

    // Find the password reset token
    const passwordResetLink = await PasswordResetLinks.findOne({
      where: { id: token },
    });

    // Token does not exist
    if (!passwordResetLink) {
      logger.error(`Reset password: Token ${token} does not exist`);
      return res.status(404).json({
        success: false,
        message: "Password reset link Invalid or expired",
      });
    }

    // Token has expired
    if (new Date() > passwordResetLink.expiresAt) {
      logger.error(`Reset password: Token ${token} has expired`);
      return res
        .status(400)
        .json({ success: false, message: "Token has expired" });
    }

    // Find the user
    const user = await User.findOne({
      where: { id: passwordResetLink.userId },
    });

    // Hash the new password
    const salt = bcrypt.genSaltSync(10);
    user.hash = bcrypt.hashSync(password, salt);

    // Save the user
    await user.save();

    // Delete the password link from
    PasswordResetLinks.destroy({
      where: { id: token },
    });

    // response
    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    logger.error(`Reset password: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Register OAuth user

// Login OAuth user

//Exports
module.exports = {
  createBasicUser,
  resetTempPassword,
  loginBasicUser,
  logOutBasicUser,
  handlePasswordResetRequest,
  resetPassword,
  createApplicationOwner,
};
