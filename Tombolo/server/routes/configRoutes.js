const express = require("express");
const router = express.Router();

const { getInstanceDetails } = require("../controllers/configController");

router.get("/instanceDetails", getInstanceDetails); // GET - instance details

module.exports = router;
