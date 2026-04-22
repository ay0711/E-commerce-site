const mongoose = require('mongoose');
const Product = require('../models/Product');
const asyncHandler = require('../utills/asyncHandler');

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

  const [products, total] = await Promise.all([
    Product.find(query).sort(sortOption).skip(skip).limit(limitNumber),
    Product.countDocuments(query),
  ]);

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
  const categories = await Product.aggregate([
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
