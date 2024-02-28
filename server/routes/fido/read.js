const express = require("express");
const router = express.Router();
const {param, validationResult} = require("express-validator");

const logger = require("../../config/logger");
const {
  getDomainFromActivityTypeId,
  getProductCategoryFromDomainAndActivityType,
  getAllDomains,
  getActivityTypesForADomain,
} = require("./data");


// Get activity types related to a specific domain
router.get("/activityTypes/:domainId",
[param("domainId").isString().isLength({min: 1})],
 async (req, res) => {

  try {
    //Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send("Invalid domainId");
    }

    const domainId = req.params.domainId;
    const activityTypes = getActivityTypesForADomain({domainId});

    res.status(200).json(activityTypes);
  } catch (error) {
    logger.error(error);
    res.status(500).send("Unable to fetch activity types");
  }
});

// Get all domains regardless of activity type
router.get("/allDomains", async (req, res) => {
  try {
    const domains = getAllDomains();
    res.status(200).json(domains);
  } catch (error) {
    logger.error(error);
    res.status(500).send("Unable to fetch domains");
  }
});


// Route to get all domains related to specific activity type
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

      const {domain, activityTypeId} = req.params;
        
      const productCategories = getProductCategoryFromDomainAndActivityType({
        domain,
        activityTypeId,
      });
      res.status(200).json(productCategories);
    } catch (error) {
      logger.error(error);
      res.status(500).send("Unable to fetch product categories");
    }
  }
);


module.exports = router;
