const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { menuValidator } = require('../middleware/validator');

router.route('/')
  .get(getMenuItems)
  .post(protect, upload.single('image'), menuValidator, createMenuItem);

router.route('/:id')
  .get(getMenuItemById)
  .put(protect, upload.single('image'), menuValidator, updateMenuItem)
  .delete(protect, deleteMenuItem);

module.exports = router;
