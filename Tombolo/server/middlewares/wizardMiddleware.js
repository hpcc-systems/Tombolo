const models = require("../models");

const User = models.user;

const validateNoUsersExist = () => {
  return async (req, res, next) => {
    //make sure there are no users registered as this route is only used to post the first few instance settings before users registered
    const users = await User.findAll();

    if (users.length > 0) {
      return res.status(403).json({ message: "Insufficient Privileges" });
    }

    next();
  };
};

module.exports = { validateNoUsersExist };
