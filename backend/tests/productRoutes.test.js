const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const { adminOnly } = require('../middleware/authMiddleware');
const productController = require('../Controllers/productController');
const Product = require('../models/Product');

const createMockResponse = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return res;
};

const createNext = () => {
  const errors = [];
  const next = (error) => {
    if (error) {
      errors.push(error);
    }
  };

  return { next, errors };
};

const stub = (object, method, implementation) => {
  const original = object[method];
  object[method] = implementation;
  return () => {
    object[method] = original;
  };
};

test('adminOnly blocks non-admin users', () => {
  const req = { user: { role: 'user' } };
  const res = createMockResponse();
  let called = false;

  adminOnly(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'Admin access required.');
});

test('createProduct creates a product for admin flow', async () => {
  const restoreFindOne = stub(Product, 'findOne', async () => null);
  const restoreCreate = stub(Product, 'create', async (payload) => ({
    _id: new mongoose.Types.ObjectId(),
    ...payload,
  }));

  const req = {
    app: { locals: {} },
    body: {
      name: 'Admin Test Set',
      slug: 'admin-test-set',
      description: 'Product created by test.',
      category: 'Luxury Sets',
      price: 199,
      stock: 7,
      image: 'https://example.com/product.jpg',
      rating: 4.9,
      featured: true,
    },
  };
  const res = createMockResponse();
  const { next, errors } = createNext();

  await productController.createProduct(req, res, next);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.product.name, 'Admin Test Set');
  assert.equal(res.body.product.category, 'Luxury Sets');
  assert.equal(errors.length, 0);

  restoreCreate();
  restoreFindOne();
});

test('listProducts returns filtered product results and pagination', async () => {
  const fakeProducts = [
    { _id: '1', name: 'Luxury Set 1', category: 'Luxury Sets', price: 120, featured: true },
    { _id: '2', name: 'Luxury Set 2', category: 'Luxury Sets', price: 140, featured: true },
  ];

  const restoreFind = stub(Product, 'find', () => ({
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return Promise.resolve(fakeProducts);
    },
  }));
  const restoreCount = stub(Product, 'countDocuments', async () => fakeProducts.length);

  const req = {
    app: { locals: {} },
    query: { category: 'Luxury Sets', featured: 'true', page: '1', limit: '12' },
  };
  const res = createMockResponse();
  const { next, errors } = createNext();

  await productController.listProducts(req, res, next);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.products.length, 2);
  assert.equal(res.body.pagination.total, 2);
  assert.equal(res.body.pagination.pages, 1);
  assert.equal(errors.length, 0);

  restoreCount();
  restoreFind();
});

test('updateProduct updates existing product fields', async () => {
  const productId = new mongoose.Types.ObjectId().toString();
  const restoreUpdate = stub(Product, 'findByIdAndUpdate', async (_id, payload) => ({
    _id: productId,
    name: 'Updated Set',
    price: payload.price,
    stock: payload.stock,
  }));

  const req = {
    app: { locals: {} },
    params: { id: productId },
    body: { price: 149, stock: 11 },
  };
  const res = createMockResponse();
  const { next, errors } = createNext();

  await productController.updateProduct(req, res, next);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.product.price, 149);
  assert.equal(res.body.product.stock, 11);
  assert.equal(errors.length, 0);

  restoreUpdate();
});

test('deleteProduct removes an existing product', async () => {
  const restoreDelete = stub(Product, 'findByIdAndDelete', async () => ({
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Deleted Product',
  }));

  const req = {
    app: { locals: {} },
    params: { id: new mongoose.Types.ObjectId().toString() },
  };
  const res = createMockResponse();
  const { next, errors } = createNext();

  await productController.deleteProduct(req, res, next);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Product deleted.');
  assert.equal(errors.length, 0);

  restoreDelete();
});
