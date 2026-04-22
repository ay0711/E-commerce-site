const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require('../Controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/mine', getMyOrders);
router.get('/admin', adminOnly, getAllOrders);
router.patch('/admin/:id/status', adminOnly, updateOrderStatus);
router.get('/:id', getOrderById);

module.exports = router;
