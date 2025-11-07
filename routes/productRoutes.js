import express from 'express';
import { 
  createProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';
import { uploadProductImages } from '../middleware/upload.js';

const router = express.Router();

// POST /api/products - Create a new product (with image uploads)
router.post('/', uploadProductImages, createProduct);

// GET /api/products - Get all products (supports ?tag=tagname query)
router.get('/', getAllProducts);

// GET /api/products/:id - Get a single product by ID
router.get('/:id', getProductById);

// PUT /api/products/:id - Update a product (with image uploads)
router.put('/:id', uploadProductImages, updateProduct);

// DELETE /api/products/:id - Delete a product
router.delete('/:id', deleteProduct);

export default router;
