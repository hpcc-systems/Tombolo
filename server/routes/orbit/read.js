const express = require("express");
const models = require("../../models");
const logger = require("../../config/logger");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const rootENV = path.join(process.cwd(), "..", ".env");
const serverENV = path.join(process.cwd(), ".env");
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
const { param, validationResult } = require("express-validator");
const validatorUtil = require("../../utils/validator");

require("dotenv").config({ path: ENVPath });

console.log("orbit runing");

router.get("/", async (req, res) => {
  logger.log("Getting Orbit Stuff!!");
});
