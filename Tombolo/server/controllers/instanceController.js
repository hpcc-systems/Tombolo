const { InstanceSetting, User } = require('../models');
const logger = require('../config/logger');

// Get a single instance setting by name
const getInstanceSetting = async (req, res) => {
  try {
    const instance = await InstanceSetting.findOne({
      where: { id: 1 },
      // Include users details - createdBy user details
      include: [
        {
          model: User,
          as: 'creator', // Use alias defined in the association
          attributes: ['firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'updater', // Use alias defined in the association
          attributes: ['firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!instance) {
      return res.status(404).json({ message: 'Instance setting not found' });
    }
    return res.status(200).json(instance);
  } catch (error) {
    logger.error('getInstanceSetting: ', error);
    return res.status(500).json({ message: error.message });
  }
};

// Update an existing instance setting by ID
const updateInstanceSetting = async (req, res) => {
  try {
    // Get the instance setting with the ID = 1
    const instance = await InstanceSetting.findOne({
      where: { id: 1 },
      raw: true,
    });

    // Get rest of the fields from the request body
    const reqData = { ...req.body };

    const payload = {};

    if (reqData.name) {
      payload.name = reqData.name;
      delete reqData.name;
    }

    // Const Existing metaData
    const { metaData } = instance;
    const updatedMetaData = { ...metaData, ...reqData };
    const finalPayload = { metaData: updatedMetaData, ...payload };

    // Update the instance setting
    const updatedInstanceCount = await InstanceSetting.update(finalPayload, {
      where: { id: 1 },
      raw: true,
    });

    // If updated instance count is 0, throw an error
    if (updatedInstanceCount[0] === 0) {
      throw new Error('Failed to update instance setting');
    }

    // Get the updated instance setting
    const updatedInstance = await InstanceSetting.findOne({
      where: { id: 1 },
      include: [
        {
          model: User,
          as: 'creator', // Use alias defined in the association
          attributes: ['firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'updater', // Use alias defined in the association
          attributes: ['firstName', 'lastName', 'email'],
        },
      ],
    });

    // Send response to the client
    return res.status(200).json({
      message: 'Instance setting updated successfully',
      data: updatedInstance,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getInstanceSetting,
  updateInstanceSetting,
};
