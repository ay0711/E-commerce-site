const mongoose = require('mongoose');
const Product = require('../models/Product');
const asyncHandler = require('../utills/asyncHandler');
const fallbackProducts = require('../utills/catalogProducts');

const toPlainProduct = (product) => ({
  _id: product._id || product.id || product.slug,
  name: product.name,
  slug: product.slug,
  description: product.description,
  category: product.category,
  price: product.price,
  stock: product.stock,
  image: product.image,
  rating: product.rating,
  featured: product.featured,
  createdAt: product.createdAt || new Date().toISOString(),
  updatedAt: product.updatedAt || new Date().toISOString(),
});

const getFallbackProducts = () => fallbackProducts.map(toPlainProduct);

const sortFallbackProducts = (products, sort) => {
  const sorted = [...products];

  if (sort === 'price-asc') return sorted.sort((left, right) => left.price - right.price);
  if (sort === 'price-desc') return sorted.sort((left, right) => right.price - left.price);
  if (sort === 'rating') return sorted.sort((left, right) => right.rating - left.rating);

  return sorted.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

const filterFallbackProducts = (products, query) =>
  products.filter((product) => {
    if (query.$text) {
      const term = String(query.$text.$search || '').toLowerCase();
      const haystack = `${product.name} ${product.description} ${product.category}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    if (query.category && product.category !== query.category) {
      return false;
    }

    if (query.featured === true && !product.featured) {
      return false;
    }

    if (query.price) {
      if (query.price.$gte !== undefined && Number(product.price) < Number(query.price.$gte)) return false;
      if (query.price.$lte !== undefined && Number(product.price) > Number(query.price.$lte)) return false;
    }

    return true;
  });

const listProducts = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    sort = 'newest',
    page = '1',
    limit = '12',
    featured,
  } = req.query;

  const query = {};

  if (q) {
    query.$text = { $search: String(q) };
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  if (featured === 'true') {
    query.featured = true;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 12, 1), 50);
  const skip = (pageNumber - 1) * limitNumber;

  let sortOption = { createdAt: -1 };
  if (sort === 'price-asc') sortOption = { price: 1 };
  if (sort === 'price-desc') sortOption = { price: -1 };
  if (sort === 'rating') sortOption = { rating: -1 };

  let products;
  let total;

  try {
    [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limitNumber),
      Product.countDocuments(query),
    ]);
  } catch (error) {
    const fallback = filterFallbackProducts(getFallbackProducts(), query);
    const sortedFallback = sortFallbackProducts(fallback, sort);
    products = sortedFallback.slice(skip, skip + limitNumber);
    total = fallback.length;
  }

  if (total === 0) {
    const fallback = filterFallbackProducts(getFallbackProducts(), query);
    const sortedFallback = sortFallbackProducts(fallback, sort);
    products = sortedFallback.slice(skip, skip + limitNumber);
    total = fallback.length;
  }

  res.status(200).json({
    products,
    pagination: {
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      limit: limitNumber,
    },
  });
});

const getCategoryMetadata = asyncHandler(async (req, res) => {
  let categories;

  try {
    categories = await Product.aggregate([
      { $sort: { featured: -1, rating: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          featuredProducts: {
            $sum: {
              $cond: [{ $eq: ['$featured', true] }, 1, 0],
            },
          },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          heroImage: { $first: '$image' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalProducts: 1,
          featuredProducts: 1,
          averagePrice: { $round: ['$averagePrice', 2] },
          minPrice: 1,
          maxPrice: 1,
          heroImage: 1,
        },
      },
      { $sort: { category: 1 } },
    ]);
  } catch (error) {
    const fallbackCategories = new Map();

    getFallbackProducts().forEach((product) => {
      const existing = fallbackCategories.get(product.category) || {
        category: product.category,
        totalProducts: 0,
        featuredProducts: 0,
        averagePrice: 0,
        minPrice: product.price,
        maxPrice: product.price,
        heroImage: product.image,
        priceTotal: 0,
      };

      existing.totalProducts += 1;
      existing.featuredProducts += product.featured ? 1 : 0;
      existing.priceTotal += Number(product.price) || 0;
      existing.minPrice = Math.min(existing.minPrice, Number(product.price) || 0);
      existing.maxPrice = Math.max(existing.maxPrice, Number(product.price) || 0);
      if (!existing.heroImage && product.image) {
        existing.heroImage = product.image;
      }

      fallbackCategories.set(product.category, existing);
    });

    categories = Array.from(fallbackCategories.values())
      .map((entry) => ({
        category: entry.category,
        totalProducts: entry.totalProducts,
        featuredProducts: entry.featuredProducts,
        averagePrice: Number((entry.priceTotal / entry.totalProducts).toFixed(2)),
        minPrice: entry.minPrice,
        maxPrice: entry.maxPrice,
        heroImage: entry.heroImage,
      }))
      .sort((left, right) => left.category.localeCompare(right.category));
  }

  if (!categories || categories.length === 0) {
    const fallbackCategories = new Map();

    getFallbackProducts().forEach((product) => {
      const existing = fallbackCategories.get(product.category) || {
        category: product.category,
        totalProducts: 0,
        featuredProducts: 0,
        averagePrice: 0,
        minPrice: product.price,
        maxPrice: product.price,
        heroImage: product.image,
        priceTotal: 0,
      };

      existing.totalProducts += 1;
      existing.featuredProducts += product.featured ? 1 : 0;
      existing.priceTotal += Number(product.price) || 0;
      existing.minPrice = Math.min(existing.minPrice, Number(product.price) || 0);
      existing.maxPrice = Math.max(existing.maxPrice, Number(product.price) || 0);

      fallbackCategories.set(product.category, existing);
    });

    categories = Array.from(fallbackCategories.values()).map((entry) => ({
      category: entry.category,
      totalProducts: entry.totalProducts,
      featuredProducts: entry.featuredProducts,
      averagePrice: Number((entry.priceTotal / entry.totalProducts).toFixed(2)),
      minPrice: entry.minPrice,
      maxPrice: entry.maxPrice,
      heroImage: entry.heroImage,
    }));
  }

  res.status(200).json({ categories });
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product id.');
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  res.status(200).json({ product });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, slug, description, category, price, stock, image, rating, featured } = req.body;

  if (!name || !slug || !description || !category || price === undefined || stock === undefined) {
    res.status(400);
    throw new Error('Required fields missing for product creation.');
  }

  const existing = await Product.findOne({ slug: String(slug).trim() });
  if (existing) {
    res.status(409);
    throw new Error('Product slug already exists.');
  }

  const product = await Product.create({
    name,
    slug,
    description,
    category,
    price,
    stock,
    image,
    rating,
    featured,
  });

  res.status(201).json({ product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product id.');
  }

  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  res.status(200).json({ product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product id.');
  }

  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  res.status(200).json({ message: 'Product deleted.' });
});

module.exports = {
  listProducts,
  getCategoryMetadata,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
