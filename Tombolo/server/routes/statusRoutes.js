const express = require('express');
const router = express.Router();
const {
  healthcheck,
  checkStatus,
  checkOwnerExists,
} = require('../controllers/statusController');

// Healthcheck endpoint for Docker (no auth required)
router.get('/health', healthcheck);

//route just to check if backend is running
router.get('/', checkStatus); // Check if backend is running
router.get('/ownerExists', checkOwnerExists); // Check if owner exists

module.exports = router;
