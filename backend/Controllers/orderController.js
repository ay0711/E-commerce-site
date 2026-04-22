const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utills/asyncHandler');

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'card' } = req.body;

  if (!shippingAddress) {
    res.status(400);
    throw new Error('Shipping address is required.');
  }

  const requiredAddressFields = ['fullName', 'line1', 'city', 'state', 'postalCode', 'country', 'phone'];
  const missingField = requiredAddressFields.find((field) => !shippingAddress[field]);
  if (missingField) {
    res.status(400);
    throw new Error(`Shipping field missing: ${missingField}`);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cannot place an order with an empty cart.');
  }

  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found for cart item: ${item.name}`);
    }

    if (item.quantity > product.stock) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}.`);
    }
  }

  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }

  const order = await Order.create({
    user: req.user._id,
    items: cart.items,
    shippingAddress,
    paymentMethod,
    totalAmount: cart.subtotal,
  });

  cart.items = [];
  cart.subtotal = 0;
  await cart.save();

  res.status(201).json({ message: 'Order created successfully.', order });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid order id.');
  }

  const order = await Order.findById(id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found.');
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order.');
  }

  res.status(200).json({ order });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
  res.status(200).json({ orders });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid order id.');
  }

  const order = await Order.findById(id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found.');
  }

  order.status = status || order.status;
  await order.save();

  res.status(200).json({ message: 'Order status updated.', order });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
