const dotenv = require('dotenv');
const connectDB = require('./config/db');
const createApp = require('./app');
const createDevFallbackStore = require('./utills/devFallbackStore');

dotenv.config();

const app = createApp();
const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    if (app.locals.devFallback) {
      app.locals.devFallbackStore = createDevFallbackStore();
      console.warn(`MongoDB unavailable, starting in development fallback mode: ${error.message}`);
      app.listen(port, () => {
        console.log(`Server running on port ${port} in fallback mode`);
      });
      return;
    }

    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
