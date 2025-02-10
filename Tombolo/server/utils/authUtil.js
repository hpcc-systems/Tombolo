// Imports from node modules
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

// Local Imports
const logger = require("../config/logger");
const model = require("../models");
const { generateToken } = require("../middlewares/csrfMiddleware");

// Constants
const User = model.user;
const UserRoles = model.UserRoles;
const RoleTypes = model.RoleTypes;
const user_application = model.user_application;
const Application = model.application;
const InstanceSettings = model.instance_settings;
const NotificationQueue = model.notification_queue;
const csrfHeaderName =
  process.env.NODE_ENV === "production"
    ? "__Host-prod.x-csrf-token"
    : "x-csrf-token";

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// Generate refresh token
const generateRefreshToken = (tokenId) => {
  return jwt.sign(tokenId, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// Verify token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// Get user by E-mail or ID
// identifier is either email or id , example : getAUser({id: 'xyz'}) or getAUser({email: 'xyz@xyz.com'})
const getAUser = async (identifier) => {
  return await User.findOne({
    where: { ...identifier },
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
};

const setTokenCookie = async (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
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
    logger.error("Error while generating csrf token:" + e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//function to trim url so we can have consistent links without //
const trimURL = (url) => {
  //cut off last character if it is a slash
  if (url[url.length - 1] === "/") {
    url = url.slice(0, -1);
  }
  return url;
};

const setPasswordExpiry = (user) => {
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


// Get Support Notification Recipient's Emails
const getSupportContactEmails = async () => {
  // Get Instance Setting
  const instanceSetting = await InstanceSettings.findOne({ raw: true });

  let supportEmailRecipientsEmail = instanceSetting.metaData.supportEmailRecipients || [];
  let supportEmailRecipientsRoles = instanceSetting.metaData.supportEmailRecipientsRoles || [];
  const supportRolesEmail = [];

  // If support email recipients exist and no support email recipients roles
 if(supportEmailRecipientsEmail.length > 0 && supportEmailRecipientsRoles.length === 0){
    return supportEmailRecipientsEmail;
  }

  //if there is no contact email, get a list of all owner and admin emails
  const ownerAndAdminEmails = await User.findAll({
    include: [
      {
        model: UserRoles,
        attributes: ["id"],
        as: "roles",
        required: true, // ensures only users with matching role types are included (INNER JOIN instead of LEFT JOIN).
        include: [
          {
            model: RoleTypes,
            as: "role_details",
            attributes: ["id", "roleName"],
            where: { roleName: { [Op.in]: supportEmailRecipientsRoles } },
          },
        ],
      },
    ],
  });



  // Get the e-mail addresses
  ownerAndAdminEmails.forEach((user) => {
    supportRolesEmail.push(user.email);
  });

  //return them
  return [...supportEmailRecipientsEmail, ...supportRolesEmail];
};

// Get Access Request Notification Recipient's Emails
const getAccessRequestContactEmails = async () => {
  // Get Instance Setting
  const instanceSetting = await InstanceSettings.findOne({ raw: true });

  let accessRequestEmailRecipientsEmail = instanceSetting.metaData.accessRequestEmailRecipientsEmail || [];
  let accessRequestEmailRecipientsRoles = instanceSetting.metaData.accessRequestEmailRecipientsRoles || [];
  const accessRequestRolesEmail = [];

  // If access email recipients exist and no support email recipients roles
  if(accessRequestEmailRecipientsEmail.length > 0 && accessRequestEmailRecipientsRoles.length === 0){
    return accessRequestEmailRecipientsEmail;
  }

  //if access email recipients do not exist, get emails for the roles specified to receive access request emails
  const ownerAndAdminEmails = await User.findAll({
    include: [
      {
        model: UserRoles,
        attributes: ["id"],
        as: "roles",
        required: true, // ensures only users with matching role types are included (INNER JOIN instead of LEFT JOIN).
        include: [
          {
            model: RoleTypes,
            as: "role_details",
            attributes: ["id", "roleName"],
            where: { roleName: { [Op.in]: accessRequestEmailRecipientsRoles } },
          },
        ],
      },
    ],
  });

  // Get the e-mail addresses
  ownerAndAdminEmails.forEach((user) => {
    accessRequestRolesEmail.push(user.email);
  });

  return [...accessRequestEmailRecipientsEmail, ...accessRequestRolesEmail];
};


const setAndSendPasswordExpiredEmail = async (user) => {
  //if the forcePasswordReset flag isn't set but the password has expired, set the flag
  if (user.passwordExpiresAt < new Date() && !user.forcePasswordReset) {
    user.forcePasswordReset = true;
  }

  //check that lastAdminNotification was more than 24 hours ago to avoid spamming the admin
  const currentTime = new Date();
  const lastAdminNotification = new Date(
    user.metaData.passwordExpiryEmailSent.lastAdminNotification
  );

  const timeSinceLastNotification =
    (currentTime - lastAdminNotification) / 1000 / 60 / 60;

  if (timeSinceLastNotification > 24 || isNaN(timeSinceLastNotification)) {
    //get contact email
    const contactEmail = await getSupportContactEmails();

    //send notification to contact email
    await NotificationQueue.create({
      type: "email",
      templateName: "passwordExpiredAdmin",
      notificationOrigin: "Password Expiry",
      deliveryType: "immediate",
      metaData: {
        notificationId: uuidv4(),
        recipientName: "Admin",
        notificationOrigin: "Password Expiry",
        subject: "User password has expired - Requesting reset",
        mainRecipients: contactEmail,
        notificationDescription: "User password has expired - Requesting reset",
        passwordResetLink: `${trimURL(
          process.env.WEB_URL
        )}/admin/usermanagement`,
        userName: user.firstName + " " + user.lastName,
        userEmail: user.email,
      },
      createdBy: user.id,
    });
  } else {
    logger.verbose(
      "Password expiry email not sent for " +
        user.email +
        " as last email was sent less than 24 hours ago"
    );
  }
  await user.update({
    metaData: {
      ...user.metaData,
      passwordExpiryEmailSent: {
        ...user.metaData.passwordExpiryEmailSent,
        lastAdminNotification: currentTime,
      },
    },
  });
  return;
};

const checkPasswordSecurityViolations = ({ password, user }) => {
  //check password for user.email, user.firstName, user.lastName
  const passwordViolations = [];

  const email = user.email;
  const firstName = user.firstName;
  const lastName = user.lastName;

  if (password.includes(email)) {
    passwordViolations.push("Password contains email address");
  }

  //check if password contains first name
  if (password.includes(firstName)) {
    passwordViolations.push("Password contains first name");
  }

  //check if password contains last name
  if (password.includes(lastName)) {
    passwordViolations.push("Password contains last name");
  }

  //TODO -- check if password contains any of previous 12 passwords

  return passwordViolations;
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
  setAndSendPasswordExpiredEmail,
  checkPasswordSecurityViolations,
  getSupportContactEmails,
  getAccessRequestContactEmails,
};
