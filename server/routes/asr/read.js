const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const { sequelize } = require("../../models");

//Local Imports
const models = require("../../models");
const logger = require("../../config/logger");

// Constants
const MonitoringTypes = models.monitoring_types;
const Domains = models.asr_domains;
const DomainMonitoringTypes = models.asr_monitoring_type_to_domains;
const Products = models.asr_products;
const DomainProduct = models.asr_domain_to_products;

// Create a new domain
router.post("/domains/",[
    body("name").notEmpty().withMessage("Domain name is required"),
    body("monitoringTypeIds")
      .optional()
      .isArray()
      .withMessage("Monitoring type is required"),
    body("createdBy").notEmpty().withMessage("Created by is required"),
  ], async (req, res) => {
    try {
      // Validate the payload
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors.array());
        return res.status(400).json({ message: "Failed to save domain" });
      }

      /* if monitoring type is provided, 
      create domain, next  iterate over monitoringTypeId and make entry to  asr_domain_monitoring_types*/
      const { name, monitoringTypeIds, createdBy } = req.body;
      let domain;
      if (monitoringTypeIds) {
        domain = await Domains.create({ name, createdBy });

        // create domain monitoring type mapping
        const createPromises = monitoringTypeIds.map((monitoringId) => {
          return DomainMonitoringTypes.create({
            domain_id: domain.id,
            monitoring_type_id: monitoringId,
            createdBy,
          });
        }
        );

        await Promise.all(createPromises);
      }

      // if no monitoring type is provided, create domain without monitoring type
      else {
        domain = await Domains.create({ name, createdBy });
      }
      res.status(200).json({message: "Domain created successfully", domain});
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: "Failed to create domain" });
    }
  }
);

//Get All domains
router.get("/domains/", async(req, res) => {
    try{
        // get all domains and the associated monitoring types by using includes
       const domains = await Domains.findAll({
         include: [
           {
             model: MonitoringTypes,
             through: {
               attributes: [], // Exclude the junction table from the result
             },
             as: "monitoringTypes", // Alias you used when defining the association
             attributes: ["id", "name"],
           },
         ],
         raw: true,
       });

        res.status(200).json(domains);
    }catch(err){
        logger.error(err);
        res.status(500).json({message: 'Failed to fetch domains'});
    }
});

// Update a domain
router.patch(
  "/domains/:id",
  [
    param("id").isUUID().withMessage("ID must be a UUID"),
    body("name").notEmpty().withMessage("Domain name is required"),
    body("monitoringTypeIds")
      .optional()
      .isArray()
      .withMessage("Monitoring must be array of UUIDs"),
    body("updatedBy").isObject().withMessage("Updated by must be an object"),
  ],
  async (req, res) => {
    try {
      // Validate the request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors.array());
        return res.status(400).json({ message: "Failed to update domain" });
      }

      // Update domain and delete or add relation in the junction table
      const { name, monitoringTypeIds, updatedBy } = req.body;
      let response;
      if (monitoringTypeIds) {
        response = await sequelize.transaction(async (t) => {
          await Domains.update(
            { name, updatedBy },
            { where: { id: req.params.id }, transaction: t }
          );

          // delete all monitoring types for the domain
          await DomainMonitoringTypes.destroy({
            where: { domain_id: req.params.id },
            transaction: t,
          });

          // create domain monitoring type mapping
          const createPromises = monitoringTypeIds.map((monitoringId) => {
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
          { name, updatedBy },
          { where: { id: req.params.id } }
        );
      }

      const message =
        response[0] === 0 ? "Domain not found" : "Successfully updated domain";
      res.status(200).json({ message });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ message: "Failed to update domain" });
    }
  }
);

// Delete a domain - this  should also delete  monitoring types to domain mapping
router.delete("/domains/:id",
[
    param("id").isUUID().withMessage("ID must be a UUID")
],
 async(req, res) => {
    try{
      //Validate
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors.array());
        return res.status(400).json({ message: "Failed to delete product" });
      }

      const response = await Domains.destroy({ where: { id: req.params.id } });
      const message =
        response === 0 ? "Domain not found" : "Domain deleted successfully";
      res.status(200).json({ message });
    }catch(err){
        logger.error(err);
        res.status(500).json({message: 'Failed to delete domain'});
    }
});

// ----------------------------------- Products -------------------------------------
//Create a new product
router.post("/products/",
[
    body("name").notEmpty().withMessage("Product name is required"),
    body("shortCode").notEmpty().withMessage("Short code is required"),
    body("tier").notEmpty().withMessage("Tier is required"),
    body("createdBy").notEmpty().withMessage("Created by is required"),
    body("domainIds").optional().isArray().withMessage("Domain ID must be an array of UUIDs"),
],
async(req, res) => {
    try{
        // Validate the request
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            logger.error(errors.array());
            return res.status(400).json({message: "Failed to save product"});
        }

        // If domainId is provided, create product domain relationship also
        const {name, shortCode, tier, createdBy, domainIds} = req.body;

        let product;
        if(domainIds){
            product = await Products.create({name, shortCode, tier, createdBy});

            //Create product domain mapping
            const createPromises = domainIds.map((domainId) => {
                return DomainProduct.create({product_id: product.id, domain_id: domainId, createdBy});
            });
            await Promise.all(createPromises);
        }else{
            product = await Products.create({name, shortCode, tier, createdBy});
        }
             res.status(200).json({message: "Product created successfully", product});

    }catch(error){
        console.log(error)
        logger.error(error);
        res.status(500).json({message: 'Failed to create product'});
    }
}
);

// Get all products
router.get("/products/", async(req, res) => {
     try {
       // get all products and the associated domains
       const products = await Products.findAll({
         include: [
           {
             model: Domains,
             through: {
               attributes: [], // Exclude the junction table from the result
             },
             as: "associatedDomains",
             attributes: ["id", "name"],
           },
         ],
         raw: true,
       });

       res.status(200).json(products);
     } catch (err) {
       logger.error(err);
       res.status(500).json({ message: "Failed to fetch domains" });
     }
});

// Patch a product
router.put(
  "/products/:id",
  [
    param("id").notEmpty().isUUID().withMessage("ID must be a UUID"),
    body("name").notEmpty().isString().withMessage("Product name is required"),
    body("shortCode").notEmpty().isString().withMessage("Short code is required"),
    body("tier").notEmpty().isInt().withMessage("Tier is required"),
    param("domainIds")
      .optional()
      .isArray()
      .withMessage("Product ID must be an array of UUIDs"),
    body("updatedBy").notEmpty().isObject().withMessage("Updated by must be an object"),
  ],
  async (req, res) => {
    try {
      // Validate the request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors.array());
        return res.status(400).json({ message: "Failed to update product" });
      }

      // Update product and delete or add relation in the junction table
      const { name, shortCode, tier, domainIds, updatedBy } = req.body;

      let response;
      if (domainIds) {
        response = await sequelize.transaction(async (t) => {
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
          const createPromises = domainIds.map((domainId) => {
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
        response[0] === 0 ? "Product not found" : "Successfully updated product";
      res.status(200).json({ message });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ message: "Failed to update product" });
    }
  }
);

// Delete a product
router.delete("/products/:id",
[
    param("id").isUUID().withMessage("ID must be a UUID")
], async(req, res) => {
    try{
      //Validate
      const errors = validationResult(req);
      if(!errors.isEmpty()){
          logger.error(errors.array());
          return res.status(400).json({message: "Failed to delete product"});
      }

      const response = await  Products.destroy({where: {id: req.params.id}});

      const message = response === 0 ? "Product not found" : "Product deleted successfully";
      res.status(200).json({message});
    }catch(err){
        logger.error(err);
        res.status(500).json({message: 'Failed to delete product'});
    }
});

module.exports = router;

