const express = require('express');
const router = express.Router();
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateCreateDomain,
  validateUpdateDomain,
  validateDeleteDomain,
  validateCreateProduct,
  validateUpdateProduct,
  validateDeleteProduct,
  validateGetDomainsForMonitoringType,
  validateGetCategoriesForDomain,
} = require('../../middlewares/asrMiddleware');
const { sequelize } = require('../../models');
const { sendError, sendSuccess } = require('../../utils/response');

//Local Imports
const {
  MonitoringType,
  AsrDomain,
  AsrMonitoringTypeToDomainsRelation: AsrDomainMonitoringTypeToDomains,
  AsrProduct,
  AsrDomainToProductsRelation,
} = require('../../models');
const logger = require('../../config/logger');
const {
  uniqueConstraintErrorHandler,
} = require('../../utils/uniqueConstraintErrorHandler');
const { getUserFkIncludes } = require('../../utils/getUserFkIncludes');

// Create a new domain
router.post('/domains/', validate(validateCreateDomain), async (req, res) => {
  try {
    /* if a monitoring type is provided,
      create a domain, then iterate over monitoringTypeId and make entry to asr_domain_monitoring_types*/
    const {
      name,
      region,
      severityThreshold,
      severityAlertRecipients,
      monitoringTypeIds,
    } = req.body;

    let domain;
    if (monitoringTypeIds) {
      domain = await AsrDomain.create({
        name,
        region,
        severityThreshold,
        severityAlertRecipients,
        createdBy: req.user.id,
      });

      // create domain monitoring type mapping
      const createPromises = monitoringTypeIds.map(monitoringId => {
        return AsrDomainMonitoringTypeToDomains.create({
          domain_id: domain.id,
          monitoring_type_id: monitoringId,
          createdBy: req.user.id,
        });
      });

      await Promise.all(createPromises);
    }

    // if no monitoring type is provided, create domain without monitoring type
    else {
      domain = await AsrDomain.create({
        name,
        region,
        severityThreshold,
        severityAlertRecipients,
        createdBy: req.user.id,
      });
    }
    return sendSuccess(res, domain, 'Domain created successfully');
  } catch (error) {
    logger.error('Failed to create domain: ', error);
    const errorResult = uniqueConstraintErrorHandler(
      error,
      'Failed to create domain'
    );
    return sendError(
      res,
      errorResult.responseObject.message || 'Failed to create domain',
      errorResult.statusCode
    );
  }
});

//Get All domains and associated monitoring types
router.get('/domains/', async (req, res) => {
  try {
    // get all domains and the associated monitoring types by using includes
    const domains = await AsrDomain.findAll({
      include: [
        ...getUserFkIncludes(),
        {
          model: MonitoringType,
          through: {
            attributes: [], // Exclude the junction table from the result
          },
          as: 'monitoringTypes', // Alias you used when defining the association
          attributes: ['id', 'name'],
        },
      ],
      raw: true,
    });

    return sendSuccess(res, domains);
  } catch (err) {
    logger.error('Get domains: ', err);
    return sendError(res, 'Failed to fetch domains');
  }
});

router.get('/domainsOnly/', async (req, res) => {
  try {
    // get all domains only
    const domains = await AsrDomain.findAll({
      raw: true,
      include: getUserFkIncludes(),
    });

    return sendSuccess(res, domains);
  } catch (err) {
    logger.error('Get domainsOnly: ', err);
    return sendError(res, 'Failed to fetch domains');
  }
});

// Update a domain
router.patch(
  '/domains/:id',
  validate(validateUpdateDomain),
  async (req, res) => {
    try {
      // Update domain and delete or add relation in the junction table
      const {
        name,
        region,
        severityThreshold,
        severityAlertRecipients,
        monitoringTypeIds,
      } = req.body;
      let response;
      if (monitoringTypeIds) {
        response = await sequelize.transaction(async t => {
          await AsrDomain.update(
            {
              name,
              region,
              severityThreshold,
              severityAlertRecipients,
              updatedBy: req.user.id,
            },
            { where: { id: req.params.id }, transaction: t }
          );

          // delete all monitoring types for the domain
          await AsrDomainMonitoringTypeToDomains.handleDelete({
            id: req.params.id,
            deletedByUserId: req.user.id,
            transaction: t,
            deleteKey: 'domain_id',
          });

          // create domain monitoring type mapping
          const createPromises = monitoringTypeIds.map(monitoringId => {
            return AsrDomainMonitoringTypeToDomains.create(
              {
                domain_id: req.params.id,
                monitoring_type_id: monitoringId,
                createdBy: req.user.id,
              },
              { transaction: t }
            );
          });

          return Promise.all(createPromises);
        });
      } else {
        response = await AsrDomain.update(
          {
            name,
            region,
            severityThreshold,
            severityAlertRecipients,
            updatedBy: req.user.id,
          },
          { where: { id: req.params.id } }
        );
      }

      if (response[0] === 0) {
        return sendError(res, 'Domain not found', 404);
      }
      return sendSuccess(res, null, 'Successfully updated domain');
    } catch (err) {
      logger.error('Failed to update domain: ', err);
      return sendError(res, 'Failed to update domain');
    }
  }
);

// Delete a domain - this should also delete monitoring types to domain mapping
router.delete(
  '/domains/:id',
  validate(validateDeleteDomain),
  async (req, res) => {
    try {
      const response = await AsrDomain.handleDelete({
        id: req.params.id,
        deletedByUserId: req.user.id,
      });

      if (response === 0) {
        return sendError(res, 'Domain not found', 404);
      }
      return sendSuccess(res, null, 'Domain deleted successfully');
    } catch (err) {
      logger.error('Delete domain: ', err);
      return sendError(res, 'Failed to delete domain');
    }
  }
);

// ----------------------------------- AsrProduct -------------------------------------
//Create a new product
router.post('/products/', validate(validateCreateProduct), async (req, res) => {
  try {
    // If domainId is provided, create product domain relationship also
    const { name, shortCode, tier, domainIds } = req.body;

    let product;
    if (domainIds) {
      product = await AsrProduct.create({
        name,
        shortCode,
        tier,
        createdBy: req.user.id,
      });

      //Create product domain mapping
      const createPromises = domainIds.map(domainId => {
        return AsrDomainToProductsRelation.create({
          product_id: product.id,
          domain_id: domainId,
          createdBy: req.user.id,
        });
      });
      await Promise.all(createPromises);
    } else {
      product = await AsrProduct.create({
        name,
        shortCode,
        tier,
        createdBy: req.user.id,
      });
    }
    return sendSuccess(res, product, 'Product created successfully');
  } catch (error) {
    logger.error('Failed to create product: ', error);
    const errorResult = uniqueConstraintErrorHandler(
      error,
      'Failed to create product'
    );
    return sendError(
      res,
      errorResult.responseObject.message || 'Failed to create product',
      errorResult.statusCode
    );
  }
});

// Get all products and related domains
router.get('/products/', async (req, res) => {
  try {
    // get all products and the associated domains
    const products = await AsrProduct.findAll({
      include: [
        ...getUserFkIncludes(),
        {
          model: AsrDomain,
          through: {
            attributes: [], // Exclude the junction table from the result
          },
          as: 'associatedDomains',
          attributes: [
            'id',
            'name',
            'region',
            'severityThreshold',
            'severityAlertRecipients',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    return sendSuccess(res, products);
  } catch (err) {
    logger.error('Get products: ', err);
    return sendError(res, 'Failed to fetch products');
  }
});

// Get all products only
router.get('/productsOnly/', async (req, res) => {
  try {
    // get all products only
    const products = await AsrProduct.findAll({
      raw: true,
      include: getUserFkIncludes(),
    });

    return sendSuccess(res, products);
  } catch (err) {
    logger.error('Get productsOnly: ', err);
    return sendError(res, 'Failed to fetch products');
  }
});

// Patch a product
router.put(
  '/products/:id',
  validate(validateUpdateProduct),
  async (req, res) => {
    try {
      // Update product and delete or add relation in the junction table
      const { name, shortCode, tier, domainIds } = req.body;

      let response;
      if (domainIds) {
        response = await sequelize.transaction(async t => {
          await AsrProduct.update(
            { name, shortCode, tier, updatedBy: req.user.id },
            { where: { id: req.params.id }, transaction: t }
          );

          // delete all domains for the product
          await AsrDomainToProductsRelation.handleDelete({
            id: req.params.id,
            deletedByUserId: req.user.id,
            transaction: t,
          });

          // create product domain mapping
          const createPromises = domainIds.map(domainId => {
            return AsrDomainToProductsRelation.create(
              {
                product_id: req.params.id,
                domain_id: domainId,
                updatedBy: req.user.id,
              },
              { transaction: t }
            );
          });

          return Promise.all(createPromises);
        });
      } else {
        response = await AsrProduct.update(
          { name, shortCode, tier, updatedBy: req.user.id },
          { where: { id: req.params.id } }
        );
      }

      if (response[0] === 0) {
        return sendError(res, 'Product not found', 404);
      }
      return sendSuccess(res, null, 'Successfully updated product');
    } catch (err) {
      logger.error('Update product: ', err);
      return sendError(res, 'Failed to update product');
    }
  }
);

// Delete a product
router.delete(
  '/products/:id',
  validate(validateDeleteProduct),
  async (req, res) => {
    try {
      const response = await AsrProduct.handleDelete({
        id: req.params.id,
        deletedByUserId: req.user.id,
      });

      if (response === 0) {
        return sendError(res, 'Product not found', 404);
      }
      return sendSuccess(res, null, 'Product deleted successfully');
    } catch (err) {
      logger.error('Delete product: ', err);
      return sendError(res, 'Failed to delete product');
    }
  }
);

// ------------------------------------------------------------------------------------------------

// Get all domains for specific monitoring (activity) type
router.get(
  '/domainsForSpecificMonitoring/:monitoringTypeId',
  validate(validateGetDomainsForMonitoringType),
  async (req, res) => {
    try {
      const monitoringTypeId = req.params.monitoringTypeId;

      // Make a call to db and get all domains for the activity type
      const domains = await AsrDomainMonitoringTypeToDomains.findAll({
        where: { monitoring_type_id: monitoringTypeId },
        include: [
          ...getUserFkIncludes(),
          {
            model: AsrDomain,
            attributes: [
              'id',
              'name',
              'region',
              'severityThreshold',
              'severityAlertRecipients',
            ],
          },
        ],
        raw: true,
      });

      // Remove junction table attributes and rename the domain object keys
      const response = domains.map(domain => {
        return { id: domain['AsrDomain.id'], name: domain['AsrDomain.name'] };
      });

      return sendSuccess(res, response);
    } catch (error) {
      logger.error('Get domain for monitoring type: ', error);
      return sendError(res, 'Unable to fetch domains');
    }
  }
);

// Route to get product category for specific domain
router.get(
  '/productCategoriesForSpecificDomain/:domainId',
  validate(validateGetCategoriesForDomain),
  async (req, res) => {
    try {
      const domainId = req.params.domainId;

      // Make a call to the AsrDomainToProductsRelation table and get all products for the domain
      const productCategories = await AsrDomainToProductsRelation.findAll({
        where: { domain_id: domainId },
        include: [
          ...getUserFkIncludes(),
          {
            model: AsrProduct,
            attributes: ['id', 'name', 'shortCode', 'tier'],
          },
        ],
        raw: true,
      });

      // remove junction table attributes and rename the product object keys
      const response = productCategories.map(product => {
        return {
          id: product['AsrProduct.id'],
          name: product['AsrProduct.name'],
          shortCode: product['AsrProduct.shortCode'],
          tier: product['AsrProduct.tier'],
        };
      });

      return sendSuccess(res, response);
    } catch (error) {
      logger.error('Get product categories for domain: ', error);
      return sendError(res, 'Unable to fetch product categories');
    }
  }
);

module.exports = router;
