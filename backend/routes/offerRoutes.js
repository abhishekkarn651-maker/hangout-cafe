const express = require('express');
const router = express.Router();
const {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer
} = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { offerValidator } = require('../middleware/validator');

router.route('/')
  .get(getOffers)
  .post(protect, upload.single('image'), offerValidator, createOffer);

router.route('/:id')
  .put(protect, upload.single('image'), offerValidator, updateOffer)
  .delete(protect, deleteOffer);

module.exports = router;
