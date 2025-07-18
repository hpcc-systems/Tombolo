const express = require('express');
const router = express.Router();

// Import middlewares
const { validateUserRole } = require('../middlewares/rbacMiddleware');
const {
  validateInstancePayload,
} = require('../middlewares/instanceMiddleware');

// Import controllers
const {
  getInstanceSetting,
  updateInstanceSetting,
} = require('../controllers/instanceController');
const role = require('../config/roleTypes');

// Routes only accessible by OWNER and ADMIN
router.use(validateUserRole([role.OWNER, role.ADMIN]));

// Routes
router.get('/', getInstanceSetting);
router.put('/', validateInstancePayload, updateInstanceSetting);

// Export
module.exports = router;
