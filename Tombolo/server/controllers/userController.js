const logger = require("../config/logger");
const models = require("../models");
const bcrypt = require("bcryptjs");

const User = models.user;
const UserRoles = models.UserRoles;

// Delete user with ID
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCount = await User.destroy({ where: { id } });

    // If deleted count is 0, user not found
    if (deletedCount === 0) {
      throw { status: 404, message: "User not found" };
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
  try {
    const { id } = req.params;
    const { firstName, lastName } = req.body;

    // Find existing user details
    const existingUser = await User.findOne({ where: { id } });

    // If user not found
    if (!existingUser) {
      throw { status: 404, message: "User not found" };
    }

    if (firstName) {
      existingUser.firstName = firstName;
    }

    if (lastName) {
      existingUser.lastName = lastName;
    }

    // If update payload is empty
    if (Object.keys(req.body).length === 0) {
      throw { status: 400, message: "No update payload provided" };
    }

    // Save user with updated details
    const updatedUser = await existingUser.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
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

    res
      .status(200)
      .json({
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
    const users = await User.findAll();
    res
      .status(200)
      .json({
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
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Find existing user details
    const existingUser = await User.findOne({ where: { id } });

    // If user not found
    if (!existingUser) {
      throw { status: 404, message: "User not found" };
    }

    // Check if current password is correct
    if (!bcrypt.compareSync(currentPassword, existingUser.hash)) {
      throw { status: 400, message: "Current password is incorrect" };
    }

    // Update password
    const salt = bcrypt.genSaltSync(10);
    existingUser.hash = bcrypt.hashSync(newPassword, salt);

    // Save user with updated details
    const updatedUser = await existingUser.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Password updated successfully",
        data: updatedUser,
      });
  } catch (err) {
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
    const deletedCount = await User.destroy({ where: { id: ids } });

    // If deleted count is 0, user not found
    if (deletedCount === 0) {
      throw { status: 404, message: "Users not found" };
    }

    // Users successfully deleted
    res
      .status(200)
      .json({
        success: true,
        message: `${deletedCount} Users deleted successfully`,
      });
  } catch (err) {
    logger.error(`Delete users: ${err.message}`);
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

    console.log(req.user);

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

    // Update roles
    const updatedRoles = await UserRoles.bulkCreate(userRoles);

    // Response
    res
      .status(200)
      .json({
        success: true,
        message: "User roles updated successfully",
        data: updatedRoles,
      });
  } catch (err) {
    console.log(err);
    logger.error(`Update user roles: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

//Exports
module.exports = {
  deleteUser,
  updateBasicUserInfo,
  getUser,
  getAllUsers,
  changePassword,
  bulkDeleteUsers,
  bulkUpdateUsers,
  updateUserRoles,
};
