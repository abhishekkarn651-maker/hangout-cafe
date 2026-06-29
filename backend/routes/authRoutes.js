const express = require('express');
const router = express.Router();
const { loginAdmin, changePassword } = require('../controllers/authController');
const { getAdminAccounts, createAdminAccount, updateAdminAccount, deleteAdminAccount } = require('../controllers/adminAccountController');
const { protect, isOwner } = require('../middleware/authMiddleware');
const { loginValidator } = require('../middleware/validator');

// POST /api/admin/login
router.post('/login', loginValidator, loginAdmin);

// PUT /api/admin/password (authenticated admins)
router.put('/password', protect, changePassword);

// Admin Accounts Management (Owner only)
router.route('/accounts')
  .get(protect, isOwner, getAdminAccounts)
  .post(protect, isOwner, createAdminAccount);

router.route('/accounts/:id')
  .put(protect, isOwner, updateAdminAccount)
  .delete(protect, isOwner, deleteAdminAccount);

module.exports = router;
