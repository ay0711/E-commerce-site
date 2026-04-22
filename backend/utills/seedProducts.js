const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const seedProducts = require('./catalogProducts');

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    await Product.deleteMany({});
    await Product.insertMany(seedProducts);
    console.log(`Seeded ${seedProducts.length} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed products:', error.message);
    process.exit(1);
  }
};

run();
