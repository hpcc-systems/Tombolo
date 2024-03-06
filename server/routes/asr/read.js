const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");

//Local Imports
const models = require("../../models");
const logger = require("../../config/logger");

// Constants
const Domains = models.asr_domains;
const Products = models.asr_products;

// Create a new domain
router.post("/domains/",
[
    body("name").notEmpty().withMessage("Domain name is required"),
    body("createdBy").notEmpty().withMessage("Created by is required")
],
async(req, res) => {
    try{
        // Validate the request
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            logger.error(errors.array());
            return res.status(400).json({message: "Failed to save domain"});
        }
        const domain = await Domains.create(req.body);
        res.status(200).json(domain);
    }catch(error){
        logger.error(error);
        res.status(500).json({message: 'Failed to create domain'});
    }
}
);

//Get All domains
router.get("/domains/", async(req, res) => {
    try{
        const domains = await Domains.findAll();
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
    body("name").notEmpty().withMessage("Domain name is required"),
    body("updatedBy").isObject().withMessage("Updated by must be an object"),
    param("id").isUUID().withMessage("ID must be a UUID"),
  ],
  async (req, res) => {
    try {
      // Validate the request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors.array());
        return res.status(400).json({ message: "Failed to update domain" });
      }

      const { name, updatedBy } = req.body;

      const response = await Domains.update(
        { name, updatedBy },
        { where: { id: req.params.id } }
      );
      const message = response[0] === 0 ? "Domain not found" : "Successfully updated domain";
      res.status(200).json({ message});
    } catch (err) {
      logger.error(err);
      res.status(500).json({ message: "Failed to update domain" });
    }
  }
);

// Delete a domain - this  should also delete  monitoring types to domain mapping
router.delete("/domains/:id", async(req, res) => {
    try{
       const response =  await Domains.destroy({where: {id: req.params.id}});
       const message = response === 0 ? "Domain not found" : "Domain deleted successfully";
      res.status(200).json({message});
    }catch(err){
        logger.error(err);
        res.status(500).json({message: 'Failed to delete domain'});
    }
});

//Create a new product
router.post("/products/",
[
    body("name").notEmpty().withMessage("Product name is required"),
    body("shortCode").notEmpty().withMessage("Short code is required"),
    body("tier").notEmpty().withMessage("Tier is required"),
    body("createdBy").notEmpty().withMessage("Created by is required")
],
async(req, res) => {
    try{
        // Validate the request
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            logger.error(errors.array());
            return res.status(400).json({message: "Failed to save product"});
        }
        const product = await Products.create(req.body);
        res.status(200).json(product);
    }catch(error){
        logger.error(error);
        res.status(500).json({message: 'Failed to create product'});
    }
}
);

// Get all products
router.get("/products/", async(req, res) => {
    try{
        const products = await Products.findAll();
        res.status(200).json(products);
    }catch(err){
        logger.error(err);
        res.status(500).json({message: 'Failed to fetch products'});
    }
});

// Patch a product
router.patch(
  "/products/:id",
  [
    // Can be empty but when entered must be correct datatypes
    body("name").optional().isString(),
    body("shortCode").optional().isString(),
    body("tier").optional().isIn(["0", "1", "2", "3"]),
    param("id").isUUID().withMessage("ID must be a UUID"),
  ],
  async (req, res) => {
    try {
      // Validate the request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors.array());
        return res.status(400).json({ message: "Failed to update product" });
      }

      const { name, shortCode, tier, updatedBy } = req.body;

      const response = await Products.update(
        { name, shortCode, tier, updatedBy },
        { where: { id: req.params.id } }
      );
      const message = response[0] === 0 ? "Product not found" : "Successfully updated product";
      res.status(200).json({ message});
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

