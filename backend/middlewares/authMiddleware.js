const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(403).json({ message: 'Token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};


const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied: Unauthorized role' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };