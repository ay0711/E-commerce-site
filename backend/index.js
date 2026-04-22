const dotenv = require('dotenv');
const connectDB = require('./config/db');
const createApp = require('./app');

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
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
