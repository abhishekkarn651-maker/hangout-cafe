const express = require('express');
const router = express.Router();
const { loginAdmin, changePassword } = require('../controllers/authController');
const { loginValidator } = require('../middleware/validator');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginValidator, loginAdmin);
router.put('/password', protect, changePassword);

module.exports = router;
