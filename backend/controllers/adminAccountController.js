const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

/**
 * @desc    Get all admin accounts
 * @route   GET /api/admin/accounts
 * @access  Private (Owner Only)
 */
const getAdminAccounts = async (req, res, next) => {
  try {
    const { data: accounts, error } = await supabase
      .from('admins')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Admin accounts fetched successfully',
      data: accounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new admin account
 * @route   POST /api/admin/accounts
 * @access  Private (Owner Only)
 */
const createAdminAccount = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
        errors: []
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        errors: []
      });
    }

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
        errors: []
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: account, error: insertError } = await supabase
      .from('admins')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: role === 'owner' ? 'owner' : 'admin'
        }
      ])
      .select('id, name, email, role, created_at')
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: account
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an admin account
 * @route   PUT /api/admin/accounts/:id
 * @access  Private (Owner Only)
 */
const updateAdminAccount = async (req, res, next) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  try {
    const { data: existing, error: checkError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
        errors: []
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    
    // Prevent the owner from changing their own role to admin
    if (role !== undefined) {
      if (existing.id === req.admin.id && role !== 'owner') {
        return res.status(400).json({
          success: false,
          message: 'You cannot change your own role from owner',
          errors: []
        });
      }
      updateData.role = role;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
          errors: []
        });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateData.password = hashedPassword;
    }

    const { data: updated, error: updateError } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, role, created_at')
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Admin account updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an admin account
 * @route   DELETE /api/admin/accounts/:id
 * @access  Private (Owner Only)
 */
const deleteAdminAccount = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (id === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
        errors: []
      });
    }

    const { data: existing, error: checkError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
        errors: []
      });
    }

    const { error: deleteError } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({
      success: true,
      message: 'Admin account deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminAccounts,
  createAdminAccount,
  updateAdminAccount,
  deleteAdminAccount
};
