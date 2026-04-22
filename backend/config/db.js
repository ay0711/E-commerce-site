const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables.');
  }

  await mongoose.connect(mongoUri, {
    maxPoolSize: 20,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    socketTimeoutMS: 60000,
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    family: 4,
  });

  console.log('MongoDB connected');
};

module.exports = connectDB;
