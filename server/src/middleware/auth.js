const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No authentication token, access denied',
        code: 'NO_TOKEN'
      });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // Store the entire verified token payload in req.user
    req.user = verified;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Session expired, please login again',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({ 
      message: 'Invalid token, please login again',
      code: 'INVALID_TOKEN'
    });
  }
}; 