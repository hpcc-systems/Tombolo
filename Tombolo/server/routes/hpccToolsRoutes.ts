import express from 'express';
import {
  checkAvailability,
  hpccToolsDocsDir,
} from '../controllers/hpccToolsController.js';

const router = express.Router();

// Must be registered before express.static so it isn't swallowed
router.get('/available', checkAvailability);
router.use(express.static(hpccToolsDocsDir));

export default router;
