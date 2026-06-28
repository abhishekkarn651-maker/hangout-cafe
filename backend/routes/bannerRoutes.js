const express = require('express');
const router = express.Router();
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
} = require('../controllers/bannerController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { bannerValidator } = require('../middleware/validator');

router.route('/')
  .get(getBanners)
  .post(protect, upload.single('image'), bannerValidator, createBanner);

router.route('/:id')
  .put(protect, upload.single('image'), bannerValidator, updateBanner)
  .delete(protect, deleteBanner);

module.exports = router;
