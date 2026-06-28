const express = require('express');
const router = Router = express.Router();
const {
  getGalleryItems,
  createGalleryItem,
  deleteGalleryItem
} = require('../controllers/galleryController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { galleryValidator } = require('../middleware/validator');

router.route('/')
  .get(getGalleryItems)
  .post(protect, upload.single('image'), galleryValidator, createGalleryItem);

router.route('/:id')
  .delete(protect, deleteGalleryItem);

module.exports = router;
