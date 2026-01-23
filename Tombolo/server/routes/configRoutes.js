import express from 'express';
const router = express.Router();

import { getInstanceDetails } from '../controllers/configController.js';

router.get('/instanceDetails', getInstanceDetails); // GET - instance details

export default router;
