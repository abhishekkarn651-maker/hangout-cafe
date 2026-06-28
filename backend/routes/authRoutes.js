const express = require('express');
const router = express.Router();
const { loginAdmin, changePassword } = require('../controllers/authController');
const { loginValidator } = require('../middleware/validator');
const { protect, isOwner } = require('../middleware/authMiddleware');
const {
  getAdminAccounts,
  createAdminAccount,
  updateAdminAccount,
  deleteAdminAccount
} = require('../controllers/adminAccountController');

router.post('/login', loginValidator, loginAdmin);
router.put('/password', protect, changePassword);

// Account management (Owner only)
router.get('/accounts', protect, isOwner, getAdminAccounts);
router.post('/accounts', protect, isOwner, createAdminAccount);
router.put('/accounts/:id', protect, isOwner, updateAdminAccount);
router.delete('/accounts/:id', protect, isOwner, deleteAdminAccount);

module.exports = router;
