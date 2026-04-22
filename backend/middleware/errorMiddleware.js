const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    message: error.message || 'Server error',
    stack: isProd ? undefined : error.stack,
  });
};

module.exports = { notFound, errorHandler };
