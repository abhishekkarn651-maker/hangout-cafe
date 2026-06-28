const express = require('express');
const router = express.Router();
const { getContact, updateContact } = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');
const { contactValidator } = require('../middleware/validator');

router.route('/')
  .get(getContact)
  .put(protect, contactValidator, updateContact);

module.exports = router;
