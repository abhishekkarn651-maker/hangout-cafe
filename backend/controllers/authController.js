const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

/**
 * @desc    Authenticate admin & get token
 * @route   POST /api/admin/login
 * @access  Public
 */
const loginAdmin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Check for admin email in Supabase
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, email, password')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      return next(error);
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errors: []
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errors: []
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Mongoose version defaulted or used JWT_EXPIRE
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change admin password
 * @route   PUT /api/admin/password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.admin.id;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
        errors: []
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'newPassword', message: 'New password must be at least 6 characters long' }]
      });
    }

    // Query admin using Supabase
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, password')
      .eq('id', adminId)
      .single();

    if (error || !admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
        errors: []
      });
    }

    // Check match
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        errors: [{ field: 'currentPassword', message: 'Current password is incorrect' }]
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update in Supabase
    const { error: updateError } = await supabase
      .from('admins')
      .update({ password: hashedPassword })
      .eq('id', adminId);

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  changePassword
};
