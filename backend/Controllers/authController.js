const User = require('../models/User');
const asyncHandler = require('../utills/asyncHandler');
const generateToken = require('../utills/generateToken');

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const fallbackStore = req.app.locals.devFallbackStore;

  if (fallbackStore) {
    const user = await fallbackStore.registerUser({ name, email, password });

    res.status(201).json({
      message: 'Registration successful.',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    return;
  }

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required.');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    res.status(409);
    throw new Error('Email already in use.');
  }

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
  });

  res.status(201).json({
    message: 'Registration successful.',
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const fallbackStore = req.app.locals.devFallbackStore;

  if (fallbackStore) {
    const user = await fallbackStore.loginUser(email, password);

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password.');
    }

    res.status(200).json({
      message: 'Login successful.',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    return;
  }

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required.');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  res.status(200).json({
    message: 'Login successful.',
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  if (req.app.locals.devFallbackStore) {
    res.status(200).json({ user: req.user });
    return;
  }

  res.status(200).json({ user: req.user });
});

module.exports = { registerUser, loginUser, getMe };
