const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (Bearer <token>)
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get admin from Supabase admins table
      const { data: admin, error } = await supabase
        .from('admins')
        .select('id, name, email, role')
        .eq('id', decoded.id)
        .single();

      if (error || !admin) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, admin account not found',
          errors: []
        });
      }

      // Attach admin to request object
      req.admin = admin;
      next();
    } catch (error) {
      console.error('Authentication Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired',
        errors: []
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
      errors: []
    });
  }
};

const isOwner = (req, res, next) => {
  if (req.admin && req.admin.role === 'owner') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only the Owner can perform this action.',
      errors: []
    });
  }
};

module.exports = { protect, isOwner };
