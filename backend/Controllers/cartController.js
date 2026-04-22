const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utills/asyncHandler');

const calculateSubtotal = (items) =>
  Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], subtotal: 0 });
  }
  return cart;
};

const getCart = asyncHandler(async (req, res) => {
  const fallbackStore = req.app.locals.devFallbackStore;

  if (fallbackStore) {
    res.status(200).json({ cart: fallbackStore.getCart(req.user._id) });
    return;
  }

  const cart = await getOrCreateCart(req.user._id);
  res.status(200).json({ cart });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const fallbackStore = req.app.locals.devFallbackStore;

  if (fallbackStore) {
    const quantityNumber = Number(quantity);
    if (!Number.isFinite(quantityNumber) || quantityNumber < 1) {
      res.status(400);
      throw new Error('Quantity must be at least 1.');
    }

    const result = fallbackStore.addToCart(req.user._id, productId, quantityNumber);
    if (result.error) {
      res.status(result.statusCode || 400);
      throw new Error(result.error);
    }

    res.status(200).json({ message: 'Item added to cart.', cart: result });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error('Invalid product id.');
  }

  const quantityNumber = Number(quantity);
  if (!Number.isFinite(quantityNumber) || quantityNumber < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1.');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  const cart = await getOrCreateCart(req.user._id);
  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

  if (itemIndex >= 0) {
    const nextQuantity = cart.items[itemIndex].quantity + quantityNumber;
    if (nextQuantity > product.stock) {
      res.status(400);
      throw new Error('Requested quantity exceeds available stock.');
    }
    cart.items[itemIndex].quantity = nextQuantity;
  } else {
    if (quantityNumber > product.stock) {
      res.status(400);
      throw new Error('Requested quantity exceeds available stock.');
    }

    cart.items.push({
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantityNumber,
    });
  }

  cart.subtotal = calculateSubtotal(cart.items);
  await cart.save();

  res.status(200).json({ message: 'Item added to cart.', cart });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const fallbackStore = req.app.locals.devFallbackStore;

  if (fallbackStore) {
    const quantityNumber = Number(quantity);
    if (!Number.isFinite(quantityNumber) || quantityNumber < 1) {
      res.status(400);
      throw new Error('Quantity must be at least 1.');
    }

    const result = fallbackStore.updateCartItem(req.user._id, productId, quantityNumber);
    if (result.error) {
      res.status(result.statusCode || 400);
      throw new Error(result.error);
    }

    res.status(200).json({ message: 'Cart item updated.', cart: result });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error('Invalid product id.');
  }

  const quantityNumber = Number(quantity);
  if (!Number.isFinite(quantityNumber) || quantityNumber < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1.');
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((entry) => entry.product.toString() === productId);

  if (!item) {
    res.status(404);
    throw new Error('Cart item not found.');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  if (quantityNumber > product.stock) {
    res.status(400);
    throw new Error('Requested quantity exceeds available stock.');
  }

  item.quantity = quantityNumber;
  cart.subtotal = calculateSubtotal(cart.items);
  await cart.save();

  res.status(200).json({ message: 'Cart item updated.', cart });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const fallbackStore = req.app.locals.devFallbackStore;

  if (fallbackStore) {
    const cart = fallbackStore.removeCartItem(req.user._id, productId);
    res.status(200).json({ message: 'Item removed from cart.', cart });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error('Invalid product id.');
  }

  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  cart.subtotal = calculateSubtotal(cart.items);
  await cart.save();

  res.status(200).json({ message: 'Item removed from cart.', cart });
});

const clearCart = asyncHandler(async (req, res) => {
  const fallbackStore = req.app.locals.devFallbackStore;

  if (fallbackStore) {
    res.status(200).json({ message: 'Cart cleared.', cart: fallbackStore.clearCart(req.user._id) });
    return;
  }

  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.subtotal = 0;
  await cart.save();

  res.status(200).json({ message: 'Cart cleared.', cart });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
