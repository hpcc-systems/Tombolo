import { Request, Response } from 'express';
import { AnalyticsFilter } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get all analytics filters for the authenticated user
 */
export async function getAnalyticsFilters(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id;

    const filters = await AnalyticsFilter.findAll({
      where: {
        createdBy: userId,
      },
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'name',
        'conditions',
        'description',
        'createdAt',
        'updatedAt',
      ],
    });

    // Convert Sequelize instances to plain objects
    const plainFilters = filters.map(f => f.toJSON());
    sendSuccess(res, plainFilters, 'Filters retrieved successfully');
  } catch (error) {
    logger.error('Error fetching analytics filters:', error);
    sendError(res, 'Failed to fetch filters', 500);
  }
}

/**
 * Get a single analytics filter by ID
 */
export async function getAnalyticsFilterById(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const filter = await AnalyticsFilter.findOne({
      where: {
        id,
        createdBy: userId,
      },
      attributes: [
        'id',
        'name',
        'conditions',
        'description',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!filter) {
      return sendError(res, 'Filter not found', 404);
    }

    sendSuccess(res, filter.toJSON(), 'Filter retrieved successfully');
  } catch (error) {
    logger.error('Error fetching analytics filter:', error);
    sendError(res, 'Failed to fetch filter', 500);
  }
}

/**
 * Create a new analytics filter
 */
export async function createAnalyticsFilter(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id;
    const { name, conditions, description } = req.body;

    // Check if filter with same name already exists for this user
    const existingFilter = await AnalyticsFilter.findOne({
      where: {
        name,
        createdBy: userId,
      },
    });

    if (existingFilter) {
      return sendError(res, 'A filter with this name already exists', 409);
    }

    const filter = await AnalyticsFilter.create({
      name,
      conditions,
      description: description || null,
      createdBy: userId!,
    });

    // Convert Sequelize instance to plain object
    sendSuccess(res, filter.toJSON(), 'Filter created successfully', 201);
  } catch (error) {
    logger.error('Error creating analytics filter:', error);
    sendError(res, 'Failed to create filter', 500);
  }
}

/**
 * Update an analytics filter
 */
export async function updateAnalyticsFilter(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { name, conditions, description } = req.body;

    const filter = await AnalyticsFilter.findOne({
      where: {
        id,
        createdBy: userId,
      },
    });

    if (!filter) {
      return sendError(res, 'Filter not found', 404);
    }

    // Check if new name conflicts with existing filter
    if (name && name !== filter.name) {
      const existingFilter = await AnalyticsFilter.findOne({
        where: {
          name,
          createdBy: userId,
        },
      });

      if (existingFilter) {
        return sendError(res, 'A filter with this name already exists', 409);
      }
    }

    await filter.update({
      name: name || filter.name,
      conditions: conditions || filter.conditions,
      description: description !== undefined ? description : filter.description,
      updatedBy: userId,
    });

    sendSuccess(res, filter.toJSON(), 'Filter updated successfully');
  } catch (error) {
    logger.error('Error updating analytics filter:', error);
    sendError(res, 'Failed to update filter', 500);
  }
}

/**
 * Delete an analytics filter (soft delete)
 */
export async function deleteAnalyticsFilter(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const filter = await AnalyticsFilter.findOne({
      where: {
        id,
        createdBy: userId,
      },
    });

    if (!filter) {
      return sendError(res, 'Filter not found', 404);
    }

    // Update deletedBy before soft delete (paranoid mode will set deletedAt)
    await filter.update({
      deletedBy: userId,
    });

    // Use destroy() to trigger paranoid soft delete
    await filter.destroy();

    sendSuccess(res, null, 'Filter deleted successfully');
  } catch (error) {
    logger.error('Error deleting analytics filter:', error);
    sendError(res, 'Failed to delete filter', 500);
  }
}
