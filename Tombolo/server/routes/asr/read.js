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

//Local Imports
const {
  monitoring_types: MonitoringTypes,
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
    return res
      .status(200)
      .json({ message: 'Domain created successfully', domain });
  } catch (error) {
    logger.error('Failed to create domain: ', error);
    const errorResult = uniqueConstraintErrorHandler(
      error,
      'Failed to create domain'
    );
    return res.status(errorResult.statusCode).json(errorResult.responseObject);
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
          model: MonitoringTypes,
          through: {
            attributes: [], // Exclude the junction table from the result
          },
          as: 'monitoringTypes', // Alias you used when defining the association
          attributes: ['id', 'name'],
        },
      ],
      raw: true,
    });

    return res.status(200).json(domains);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).json({ message: 'Failed to fetch domains' });
  }
});

router.get('/domainsOnly/', async (req, res) => {
  try {
    // get all domains only
    const domains = await AsrDomain.findAll({
      raw: true,
      include: getUserFkIncludes(),
    });

    return res.status(200).json(domains);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).json({ message: 'Failed to fetch domains' });
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
          });

          // create domain monitoring type mapping
          const createPromises = monitoringTypeIds.map(monitoringId => {
            return AsrDomainMonitoringTypeToDomains.create(
              {
                domain_id: req.params.id,
                monitoring_type_id: monitoringId,
                updatedBy: req.user.id,
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

      const message =
        response[0] === 0 ? 'Domain not found' : 'Successfully updated domain';
      return res.status(200).json({ message });
    } catch (err) {
      logger.error(err.message);
      return res.status(500).json({ message: 'Failed to update domain' });
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

      const message =
        response === 0 ? 'Domain not found' : 'Domain deleted successfully';
      return res.status(200).json({ message });
    } catch (err) {
      logger.error(err.message);
      return res.status(500).json({ message: 'Failed to delete domain' });
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
    return res
      .status(200)
      .json({ message: 'Product created successfully', product });
  } catch (error) {
    logger.error('Failed to create product: ', error);
    const errorResult = uniqueConstraintErrorHandler(
      error,
      'Failed to create product'
    );
    return res.status(errorResult.statusCode).json(errorResult.responseObject);
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

    return res.status(200).json(products);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).json({ message: 'Failed to fetch domains' });
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

    return res.status(200).json(products);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).json({ message: 'Failed to fetch products' });
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

      const message =
        response[0] === 0
          ? 'Product not found'
          : 'Successfully updated product';
      return res.status(200).json({ message });
    } catch (err) {
      logger.error(err.message);
      return res.status(500).json({ message: 'Failed to update product' });
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

      const message =
        response === 0 ? 'Product not found' : 'Product deleted successfully';
      return res.status(200).json({ message });
    } catch (err) {
      logger.error(err.message);
      return res.status(500).json({ message: 'Failed to delete product' });
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
        return { id: domain['asr_domain.id'], name: domain['asr_domain.name'] };
      });

      return res.status(200).json(response);
    } catch (error) {
      logger.error(error.message);
      return res.status(500).send('Unable to fetch domains');
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
          id: product['asr_product.id'],
          name: product['asr_product.name'],
          shortCode: product['asr_product.shortCode'],
          tier: product['asr_product.tier'],
        };
      });

      return res.status(200).json(response);
    } catch (error) {
      logger.error(error.message);
      return res.status(500).send('Unable to fetch product categories');
    }
  }
);

module.exports = router;
