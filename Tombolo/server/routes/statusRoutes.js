const express = require('express');
const router = express.Router();
const {
  checkStatus,
  checkOwnerExists,
} = require('../controllers/statusController');

//route just to check if backend is running
router.get('/', checkStatus); // Check if backend is running
router.get('/ownerExists', checkOwnerExists); // Check if owner exists

module.exports = router;
