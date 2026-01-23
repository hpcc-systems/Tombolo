import { InstanceSettings, User } from '../models/index.js';
import logger from '../config/logger.js';
import { sendSuccess, sendError } from '../utils/response.js';
import CustomError from '../utils/customError.js';

// Get a single instance setting by name
const getInstanceSetting = async (req, res) => {
  try {
    const instance = await InstanceSettings.findOne({
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
      logger.error('Failed to get instance settings');
      return sendError(res, 'Instance setting not found', 404);
    }
    return sendSuccess(
      res,
      instance,
      'Instance setting retrieved successfully'
    );
  } catch (error) {
    logger.error('getInstanceSetting: ', error);
    return sendError(res, error);
  }
};

// Update an existing instance setting by ID
const updateInstanceSetting = async (req, res) => {
  try {
    // Get the instance setting with the ID = 1
    const instance = await InstanceSettings.findOne({
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
    const updatedInstanceCount = await InstanceSettings.update(finalPayload, {
      where: { id: 1 },
      raw: true,
    });

    // If updated instance count is 0, throw an error
    if (updatedInstanceCount[0] === 0) {
      throw new CustomError('Failed to update instance setting', 500);
    }

    // Get the updated instance setting
    const updatedInstance = await InstanceSettings.findOne({
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
    return sendSuccess(
      res,
      updatedInstance,
      'Instance setting updated successfully'
    );
  } catch (error) {
    return sendError(res, error);
  }
};

export { getInstanceSetting, updateInstanceSetting };
