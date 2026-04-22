const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const createApp = () => {
  const app = express();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many auth requests. Try again shortly.' },
  });

  app.use(helmet());
  app.use(
    cors({
      origin: frontendUrl.split(',').map((origin) => origin.trim()),
      credentials: true,
    })
  );
  app.use(globalLimiter);
  app.use(mongoSanitize());
  app.use(express.json({ limit: '10kb' }));
  app.locals.devFallback = process.env.DEV_FALLBACK !== 'false' && process.env.NODE_ENV !== 'production';

  app.get('/', (req, res) => {
    res.json({ message: 'Ayanfe Clothings API is running' });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
