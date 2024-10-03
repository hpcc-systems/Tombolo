const express = require('express');
const router = express.Router();

const { getAllRoles } = require("../controllers/roleTypesController");
const {validateUserRole} = require('../middlewares/rbacMiddleware');
const role = require("../config/roleTypes");


// Middleware to to check access
router.use(validateUserRole([role.OWNER, role.ADMIN]));

// Get all roles
router.get("/", getAllRoles);

module.exports = router;