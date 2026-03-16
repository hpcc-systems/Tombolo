// Imports from libraries
import express from 'express';

// Local imports
const router = express.Router();
import { validate } from '../middlewares/validateRequestBody.js';
import {
  validateCreateDomain,
  validateUpdateDomain,
  validateDeleteDomain,
  validateCreateProduct,
  validateUpdateProduct,
  validateDeleteProduct,
  validateGetDomainsForMonitoringType,
  validateGetCategoriesForDomain,
} from '../middlewares/asrMiddleware.js';
import {
  createDomain,
  getDomains,
  getDomainsOnly,
  updateDomain,
  deleteDomain,
  createProduct,
  getProductsAndDomains,
  getProducts,
  updateProduct,
  deleteProduct,
  getDomainByMonitoringType,
  getProductsByDomain,
} from '../controllers/asrController.js';

// Create a new domain
router.post('/domains/', validate(validateCreateDomain), createDomain);

//Get All domains and associated monitoring types
router.get('/domains/', getDomains);

router.get('/domainsOnly/', getDomainsOnly);

// Update a domain
router.patch('/domains/:id', validate(validateUpdateDomain), updateDomain);

// Delete a domain - this should also delete monitoring types to domain mapping
router.delete('/domains/:id', validate(validateDeleteDomain), deleteDomain);

// ----------------------------------- AsrProduct -------------------------------------
//Create a new product
router.post('/products/', validate(validateCreateProduct), createProduct);

// Get all products and related domains
router.get('/products/', getProductsAndDomains);

// Get all products only
router.get('/productsOnly/', getProducts);

// Patch a product
router.put('/products/:id', validate(validateUpdateProduct), updateProduct);

// Delete a product
router.delete('/products/:id', validate(validateDeleteProduct), deleteProduct);

// ------------------------------------------------------------------------------------------------

// Get all domains for a specific monitoring (activity) type
router.get(
  '/domainsForSpecificMonitoring/:monitoringTypeId',
  validate(validateGetDomainsForMonitoringType),
  getDomainByMonitoringType
);

// Route to get product category for specific domain
router.get(
  '/productCategoriesForSpecificDomain/:domainId',
  validate(validateGetCategoriesForDomain),
  getProductsByDomain
);

export default router;
