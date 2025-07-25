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
  asr_domains: Domains,
  asr_monitoring_type_to_domains: DomainMonitoringTypes,
  asr_products: Products,
  asr_domain_to_products: DomainProduct,
} = require('../../models');
const logger = require('../../config/logger');

// Create a new domain
router.post('/domains/', validate(validateCreateDomain), async (req, res) => {
  try {
    /* if monitoring type is provided,
      create domain, next  iterate over monitoringTypeId and make entry to  asr_domain_monitoring_types*/
    const {
      name,
      region,
      severityThreshold,
      severityAlertRecipients,
      monitoringTypeIds,
      createdBy,
    } = req.body;
    let domain;
    if (monitoringTypeIds) {
      domain = await Domains.create({
        name,
        region,
        severityThreshold,
        severityAlertRecipients,
        createdBy,
      });

      // create domain monitoring type mapping
      const createPromises = monitoringTypeIds.map(monitoringId => {
        return DomainMonitoringTypes.create({
          domain_id: domain.id,
          monitoring_type_id: monitoringId,
          createdBy,
        });
      });

      await Promise.all(createPromises);
    }

    // if no monitoring type is provided, create domain without monitoring type
    else {
      domain = await Domains.create({
        name,
        region,
        severityThreshold,
        severityAlertRecipients,
        createdBy,
      });
    }
    return res
      .status(200)
      .json({ message: 'Domain created successfully', domain });
  } catch (error) {
    logger.error(error.message);
    return res.status(500).json({ message: 'Failed to create domain' });
  }
});

//Get All domains and associated monitoring types
router.get('/domains/', async (req, res) => {
  try {
    // get all domains and the associated monitoring types by using includes
    const domains = await Domains.findAll({
      include: [
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
    const domains = await Domains.findAll({
      raw: true,
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
        updatedBy,
      } = req.body;
      let response;
      if (monitoringTypeIds) {
        response = await sequelize.transaction(async t => {
          await Domains.update(
            {
              name,
              region,
              severityThreshold,
              severityAlertRecipients,
              updatedBy,
            },
            { where: { id: req.params.id }, transaction: t }
          );

          // delete all monitoring types for the domain
          await DomainMonitoringTypes.destroy({
            where: { domain_id: req.params.id },
            transaction: t,
          });

          // create domain monitoring type mapping
          const createPromises = monitoringTypeIds.map(monitoringId => {
            return DomainMonitoringTypes.create(
              {
                domain_id: req.params.id,
                monitoring_type_id: monitoringId,
                updatedBy,
              },
              { transaction: t }
            );
          });

          return Promise.all(createPromises);
        });
      } else {
        response = await Domains.update(
          {
            name,
            region,
            severityThreshold,
            severityAlertRecipients,
            updatedBy,
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

// Delete a domain - this  should also delete  monitoring types to domain mapping
router.delete(
  '/domains/:id',
  validate(validateDeleteDomain),
  async (req, res) => {
    try {
      const response = await Domains.destroy({ where: { id: req.params.id } });
      const message =
        response === 0 ? 'Domain not found' : 'Domain deleted successfully';
      return res.status(200).json({ message });
    } catch (err) {
      logger.error(err.message);
      return res.status(500).json({ message: 'Failed to delete domain' });
    }
  }
);

// ----------------------------------- Products -------------------------------------
//Create a new product
router.post('/products/', validate(validateCreateProduct), async (req, res) => {
  try {
    // If domainId is provided, create product domain relationship also
    const { name, shortCode, tier, createdBy, domainIds } = req.body;

    let product;
    if (domainIds) {
      product = await Products.create({ name, shortCode, tier, createdBy });

      //Create product domain mapping
      const createPromises = domainIds.map(domainId => {
        return DomainProduct.create({
          product_id: product.id,
          domain_id: domainId,
          createdBy,
        });
      });
      await Promise.all(createPromises);
    } else {
      product = await Products.create({ name, shortCode, tier, createdBy });
    }
    return res
      .status(200)
      .json({ message: 'Product created successfully', product });
  } catch (error) {
    logger.error(error.message);
    return res.status(500).json({ message: 'Failed to create product' });
  }
});

// Get all products and related domains
router.get('/products/', async (req, res) => {
  try {
    // get all products and the associated domains
    const products = await Products.findAll({
      include: [
        {
          model: Domains,
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
    const products = await Products.findAll({
      raw: true,
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
      const { name, shortCode, tier, domainIds, updatedBy } = req.body;

      let response;
      if (domainIds) {
        response = await sequelize.transaction(async t => {
          await Products.update(
            { name, shortCode, tier, updatedBy },
            { where: { id: req.params.id }, transaction: t }
          );

          // delete all domains for the product
          await DomainProduct.destroy({
            where: { product_id: req.params.id },
            transaction: t,
          });

          // create product domain mapping
          const createPromises = domainIds.map(domainId => {
            return DomainProduct.create(
              {
                product_id: req.params.id,
                domain_id: domainId,
                updatedBy,
              },
              { transaction: t }
            );
          });

          return Promise.all(createPromises);
        });
      } else {
        response = await Products.update(
          { name, shortCode, tier, updatedBy },
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
      const response = await Products.destroy({ where: { id: req.params.id } });

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

      // Make call to db and  get all domains for the activity type
      const domains = await DomainMonitoringTypes.findAll({
        where: { monitoring_type_id: monitoringTypeId },
        include: [
          {
            model: Domains,
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

      // Make a call to DomainProduct table and get all products for the domain
      const productCategories = await DomainProduct.findAll({
        where: { domain_id: domainId },
        include: [
          {
            model: Products,
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
