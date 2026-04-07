const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Velox Auth Middleware
// Protects routes that require authentication

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    }
    res.status(403).json({ message: 'Access denied' });
  };
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // token invalid, continue as guest
  }
  next();
};
``
const refreshToken = async (req, res) => {
  const { token } = req.body;

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const newToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET
  );

  res.json({ token: newToken });
};

module.exports = { authenticate, authorize, optionalAuth, refreshToken };
