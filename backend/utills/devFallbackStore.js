const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const catalogProducts = require('./catalogProducts');

const clone = (value) => JSON.parse(JSON.stringify(value));

const baseProducts = catalogProducts;

const createFallbackProduct = (product) => ({
  _id: randomUUID(),
  ...product,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createDevFallbackStore = () => {
  const store = {
    products: baseProducts.map(createFallbackProduct),
    users: [],
    carts: new Map(),
    orders: [],
  };

  const ensureDemoUsers = async () => {
    if (store.users.length > 0) {
      return;
    }

    const passwordHash = await bcrypt.hash('Password123!', 10);
    store.users.push(
      {
        _id: randomUUID(),
        name: 'Demo Admin',
        email: 'admin@ayanfeclothings.com',
        passwordHash,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: randomUUID(),
        name: 'Demo Customer',
        email: 'customer@ayanfeclothings.com',
        passwordHash,
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  };

  const normalizeEmail = (email) => String(email).toLowerCase().trim();

  const findProductIndex = (id) => store.products.findIndex((product) => product._id === id);
  const findOrderIndex = (id) => store.orders.findIndex((order) => order._id === id);

  const calculateSubtotal = (items) =>
    Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));

  const paginate = (items, page, limit) => {
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    return {
      data: items.slice(skip, skip + limitNumber),
      pagination: {
        total: items.length,
        page: pageNumber,
        pages: Math.max(Math.ceil(items.length / limitNumber), 1),
        limit: limitNumber,
      },
    };
  };

  return {
    ensureDemoUsers,
    listProducts(query = {}) {
      let items = [...store.products];

      if (query.q) {
        const needle = String(query.q).toLowerCase();
        items = items.filter((product) => {
          const haystack = `${product.name} ${product.description} ${product.category}`.toLowerCase();
          return haystack.includes(needle);
        });
      }

      if (query.category && query.category !== 'All') {
        items = items.filter((product) => product.category === query.category);
      }

      if (query.featured === 'true') {
        items = items.filter((product) => product.featured);
      }

      if (query.minPrice || query.maxPrice) {
        items = items.filter((product) => {
          const min = query.minPrice ? Number(query.minPrice) : Number.NEGATIVE_INFINITY;
          const max = query.maxPrice ? Number(query.maxPrice) : Number.POSITIVE_INFINITY;
          return product.price >= min && product.price <= max;
        });
      }

      if (query.sort === 'price-asc') items.sort((a, b) => a.price - b.price);
      else if (query.sort === 'price-desc') items.sort((a, b) => b.price - a.price);
      else if (query.sort === 'rating') items.sort((a, b) => b.rating - a.rating);
      else items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const { data, pagination } = paginate(items, query.page, query.limit);
      return { products: clone(data), pagination };
    },
    getProductById(id) {
      const product = store.products.find((item) => item._id === id);
      return product ? clone(product) : null;
    },
    createProduct(payload) {
      const existing = store.products.find((product) => product.slug === payload.slug);
      if (existing) {
        const error = new Error('Product slug already exists.');
        error.statusCode = 409;
        throw error;
      }

      const now = new Date().toISOString();
      const product = {
        _id: randomUUID(),
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        category: payload.category,
        price: Number(payload.price),
        stock: Number(payload.stock),
        image: payload.image || '',
        rating: payload.rating === undefined ? 4.8 : Number(payload.rating),
        featured: Boolean(payload.featured),
        createdAt: now,
        updatedAt: now,
      };

      store.products.unshift(product);
      return clone(product);
    },
    updateProduct(id, payload) {
      const index = findProductIndex(id);
      if (index === -1) return null;

      const nextProduct = {
        ...store.products[index],
        ...payload,
        updatedAt: new Date().toISOString(),
      };

      store.products[index] = nextProduct;
      return clone(nextProduct);
    },
    deleteProduct(id) {
      const index = findProductIndex(id);
      if (index === -1) return null;

      const [removed] = store.products.splice(index, 1);
      return clone(removed);
    },
    async registerUser({ name, email, password }) {
      await ensureDemoUsers();
      const normalizedEmail = normalizeEmail(email);
      const existing = store.users.find((user) => user.email === normalizedEmail);
      if (existing) {
        const error = new Error('Email already in use.');
        error.statusCode = 409;
        throw error;
      }

      const now = new Date().toISOString();
      const user = {
        _id: randomUUID(),
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'user',
        createdAt: now,
        updatedAt: now,
      };

      store.users.push(user);
      return clone(user);
    },
    async loginUser(email, password) {
      await ensureDemoUsers();
      const normalizedEmail = normalizeEmail(email);
      const user = store.users.find((item) => item.email === normalizedEmail);
      if (!user) return null;

      const matches = await bcrypt.compare(password, user.passwordHash);
      return matches ? clone(user) : null;
    },
    async getUserById(id) {
      await ensureDemoUsers();
      const user = store.users.find((item) => item._id === id);
      if (!user) return null;
      const { passwordHash, ...rest } = user;
      return clone(rest);
    },
    getCart(userId) {
      if (!store.carts.has(userId)) {
        store.carts.set(userId, { user: userId, items: [], subtotal: 0 });
      }
      return clone(store.carts.get(userId));
    },
    addToCart(userId, productId, quantity) {
      const product = store.products.find((item) => item._id === productId);
      if (!product) return { error: 'Product not found.', statusCode: 404 };

      const cart = store.carts.get(userId) || { user: userId, items: [], subtotal: 0 };
      const itemIndex = cart.items.findIndex((item) => item.product === productId);
      const requestedQuantity = Number(quantity);

      if (itemIndex >= 0) {
        const nextQuantity = cart.items[itemIndex].quantity + requestedQuantity;
        if (nextQuantity > product.stock) {
          return { error: 'Requested quantity exceeds available stock.', statusCode: 400 };
        }
        cart.items[itemIndex].quantity = nextQuantity;
      } else {
        if (requestedQuantity > product.stock) {
          return { error: 'Requested quantity exceeds available stock.', statusCode: 400 };
        }
        cart.items.push({
          product: productId,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: requestedQuantity,
        });
      }

      cart.subtotal = calculateSubtotal(cart.items);
      store.carts.set(userId, cart);
      return clone(cart);
    },
    updateCartItem(userId, productId, quantity) {
      const cart = store.carts.get(userId) || { user: userId, items: [], subtotal: 0 };
      const item = cart.items.find((entry) => entry.product === productId);
      if (!item) return { error: 'Cart item not found.', statusCode: 404 };

      const product = store.products.find((entry) => entry._id === productId);
      if (!product) return { error: 'Product not found.', statusCode: 404 };

      const requestedQuantity = Number(quantity);
      if (requestedQuantity > product.stock) {
        return { error: 'Requested quantity exceeds available stock.', statusCode: 400 };
      }

      item.quantity = requestedQuantity;
      cart.subtotal = calculateSubtotal(cart.items);
      store.carts.set(userId, cart);
      return clone(cart);
    },
    removeCartItem(userId, productId) {
      const cart = store.carts.get(userId) || { user: userId, items: [], subtotal: 0 };
      cart.items = cart.items.filter((item) => item.product !== productId);
      cart.subtotal = calculateSubtotal(cart.items);
      store.carts.set(userId, cart);
      return clone(cart);
    },
    clearCart(userId) {
      const cart = { user: userId, items: [], subtotal: 0 };
      store.carts.set(userId, cart);
      return clone(cart);
    },
    createOrder(userId, shippingAddress, paymentMethod = 'card') {
      const cart = store.carts.get(userId) || { items: [], subtotal: 0 };
      if (!cart.items.length) {
        return { error: 'Cannot place an order with an empty cart.', statusCode: 400 };
      }

      for (const item of cart.items) {
        const product = store.products.find((entry) => entry._id === item.product);
        if (!product) {
          return { error: `Product not found for cart item: ${item.name}`, statusCode: 404 };
        }
        if (item.quantity > product.stock) {
          return { error: `Insufficient stock for ${product.name}.`, statusCode: 400 };
        }
      }

      for (const item of cart.items) {
        const product = store.products.find((entry) => entry._id === item.product);
        product.stock -= item.quantity;
      }

      const now = new Date().toISOString();
      const order = {
        _id: randomUUID(),
        user: userId,
        items: clone(cart.items),
        shippingAddress: clone(shippingAddress),
        paymentMethod,
        totalAmount: cart.subtotal,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      store.orders.unshift(order);
      store.carts.set(userId, { user: userId, items: [], subtotal: 0 });
      return clone(order);
    },
    getMyOrders(userId) {
      return clone(store.orders.filter((order) => order.user === userId));
    },
    getOrderById(id) {
      const order = store.orders.find((item) => item._id === id);
      return order ? clone(order) : null;
    },
    getAllOrders() {
      return clone(store.orders);
    },
    updateOrderStatus(id, status) {
      const index = findOrderIndex(id);
      if (index === -1) return null;

      store.orders[index].status = status || store.orders[index].status;
      store.orders[index].updatedAt = new Date().toISOString();
      return clone(store.orders[index]);
    },
  };

  return store;
};

module.exports = createDevFallbackStore;
