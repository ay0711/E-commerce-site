const User = require('../models/User');
const asyncHandler = require('../utills/asyncHandler');
const generateToken = require('../utills/generateToken');

const createFallbackPassword = () => {
  const randomPart = Math.random().toString(36).slice(2, 12);
  return `Soc!al-${randomPart}-Ayanfe`;
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

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
  res.status(200).json({ user: req.user });
});

const socialAuth = asyncHandler(async (req, res) => {
  const { provider, email, name, socialId, avatar } = req.body;

  const normalizedProvider = String(provider || '').toLowerCase().trim();
  if (!['google', 'github'].includes(normalizedProvider)) {
    res.status(400);
    throw new Error('Unsupported social provider.');
  }

  if (!email || !name) {
    res.status(400);
    throw new Error('Name and email are required for social authentication.');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: createFallbackPassword(),
      socialProvider: normalizedProvider,
      socialId: socialId ? String(socialId).trim() : '',
      avatar: avatar ? String(avatar).trim() : '',
    });
  } else {
    const updates = {};
    if (!user.socialProvider) updates.socialProvider = normalizedProvider;
    if (!user.socialId && socialId) updates.socialId = String(socialId).trim();
    if (avatar) updates.avatar = String(avatar).trim();

    if (Object.keys(updates).length > 0) {
      user = await User.findByIdAndUpdate(user._id, updates, { new: true });
    }
  }

  res.status(200).json({
    message: `Signed in with ${normalizedProvider}.`,
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      socialProvider: user.socialProvider,
      avatar: user.avatar,
    },
  });
});

module.exports = { registerUser, loginUser, getMe, socialAuth };
