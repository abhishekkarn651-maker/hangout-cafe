const express = require('express');
const router = express.Router();
const { getAbout, updateAbout } = require('../controllers/aboutController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { aboutValidator } = require('../middleware/validator');

router.route('/')
  .get(getAbout)
  .put(protect, upload.single('image'), aboutValidator, updateAbout);

module.exports = router;
