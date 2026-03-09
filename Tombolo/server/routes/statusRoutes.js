import express from 'express';
const router = express.Router();
import {
  healthcheck,
  checkStatus,
  checkOwnerExists,
} from '../controllers/statusController.js';

// Healthcheck endpoint for Docker (no auth required)
router.get('/health', healthcheck);

//route just to check if backend is running
router.get('/', checkStatus); // Check if backend is running
router.get('/ownerExists', checkOwnerExists); // Check if owner exists

export default router;
