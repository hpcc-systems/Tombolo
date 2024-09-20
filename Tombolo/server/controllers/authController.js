const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {v4: uuidv4} = require("uuid");

const logger = require("../config/logger");
const models = require("../models");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/authUtil");

const User = models.user;
const UserRoles = models.UserRoles;
const RoleTypes = models.RoleTypes;
const RefreshTokens = models.RefreshTokens;

// Register basic user
const createBasicUser = async (req, res) => {
  try {
    const { deviceInfo = {} } = req.body;
    const payload = req.body;

    // Hash password
    payload.hash = bcrypt.hashSync(req.body.password, 10);

    // Save user to DB
    const user = await User.create(payload);

    // remove hash from user object
    const userObj = user.toJSON();
    delete userObj.hash;

    // Create token id
    const tokenId = uuidv4();

    // Create access jwt
    userObj.token = generateAccessToken({ ...userObj, tokenId });

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
      data: {...userObj,  "UserRoles": [],},
    });
  } catch (err) {
    logger.error(`Create user: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

//Login Basic user
const loginBasicUser = async (req, res) => {
  try {
    const { email, password, deviceInfo = {} } = req.body;

    // find user - include user roles from UserRoles table
    const user = await User.findOne({
      where: { email },
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
      ],
    });

    // User with the given email does not exist
    if (!user) {
      logger.error(`Login : User with email ${email} does not exist`);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    //Compare password
    if (!bcrypt.compareSync(password, user.hash)) {
      logger.error(`Login : Invalid password for user with email ${email}`);
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // Remove hash from use object
    const userObj = user.toJSON();
    delete userObj.hash;

    // Create token id
    const tokenId = uuidv4();

    // Create access jwt
    userObj.token = generateAccessToken({ ...userObj, tokenId });

    // Generate refresh token
    const refreshToken = generateRefreshToken({ tokenId });

    // Save refresh token to DB
    const { iat, exp } = jwt.decode(refreshToken);

    // Save refresh token in DB
    await RefreshTokens.create({id: tokenId,
      userId: user.id, 
      token: refreshToken, 
      deviceInfo, 
      metaData: {}, 
      iat : new Date(iat * 1000), 
      exp : new Date(exp * 1000)});

    // Success response
    res.status(200).json({ success: true, message: "User logged in successfully", data: userObj });
  } catch (err) {
    logger.error(`Login user: ${err.message}`);
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

// Register OAuth user

// Login OAuth user

//Exports
module.exports = {
  createBasicUser,
  loginBasicUser,
};
