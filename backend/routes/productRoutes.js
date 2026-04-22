const express = require('express');
const {
  listProducts,
  getCategoryMetadata,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../Controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', listProducts);
router.get('/categories/meta', getCategoryMetadata);
router.get('/:id', getProductById);
router.post('/', protect, adminOnly, createProduct);
router.patch('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
