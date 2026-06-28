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
        .select('id, email')
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

module.exports = { protect };
