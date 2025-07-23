const express = require('express');
const router = express.Router();

const { getAllRoles } = require('../controllers/roleTypesController');
const { validateUserRole } = require('../middlewares/rbacMiddleware');
const role = require('../config/roleTypes');

// Middleware to get all roles
router.use(
  validateUserRole([role.OWNER, role.ADMIN, role.READER, role.CONTRIBUTOR])
);

// Get all roles
router.get('/', getAllRoles);

module.exports = router;
