const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Token required' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return res.status(500).json({
      message: 'Authentication configuration error'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId || decoded.user_id,
      role: typeof decoded.role === 'string'
        ? decoded.role.trim().toLowerCase()
        : ''
    };

    if (!req.user.userId || !req.user.role) {
      return res.status(401).json({
        message: 'Invalid authentication token'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};

const authorizeRoles = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map((role) =>
    String(role).trim().toLowerCase()
  );

  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'Access denied: Unauthorized role'
      });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };