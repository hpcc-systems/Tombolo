const express = require("express");
const router = express.Router();
const {param, validationResult} = require("express-validator");

const logger = require("../../config/logger");
const {
  getDomainFromActivityTypeId,
  getProductCategoryFromDomainAndActivityType,
} = require("./data");


// Route to get all domains
router.get("/domains/:activityTypeId",
[param("activityTypeId").isString().isLength({min: 1})],
 async(req, res) => {
  try{
    //Validate request
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).send("Invalid activityTypeId");
    }

    const activityTypeId = req.params.activityTypeId;
    const domain = getDomainFromActivityTypeId({activityTypeId});
    res.status(200).json(domain);
  }catch(error){
    logger.error(error)
    res.status(500).send("Unable to fetch domains");
  }
});

// Route to get product category for specific domain and activity type
router.get(
  "/productCategories/:domain/:activityTypeId",
  [
    param("domain").isString().isLength({ min: 1 }),
    param("activityTypeId").isString().isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      //Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send("Invalid domain or activityTypeId");
      }

      const domain = req.params.domain;
      const activityTypeId = req.params.activityTypeId;
      const productCategory = getProductCategoryFromDomainAndActivityType({
        domain,
        activityTypeId,
      });
      res.status(200).json(productCategory);
    } catch (error) {
      logger.error(error);
      res.status(500).send("Unable to fetch product categories");
    }
  }
);


module.exports = router;
