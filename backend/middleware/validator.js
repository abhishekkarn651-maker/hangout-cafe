const { body, validationResult } = require('express-validator');

// General middleware to run validation and format error responses
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Validation rules for Admin Login
const loginValidator = [
  body('email')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

// Validation rules for Banner (POST / PUT)
const bannerValidator = [
  body('title')
    .optional()
    .trim()
    .isString().withMessage('Title must be a string'),
  body('subtitle')
    .optional()
    .trim()
    .isString().withMessage('Subtitle must be a string'),
  body('ctaText')
    .optional()
    .trim()
    .isString().withMessage('CTA Text must be a string'),
  body('ctaLink')
    .optional()
    .trim()
    .isString().withMessage('CTA Link must be a string'),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a non-negative integer')
    .toInt(),
  validate
];

// Validation rules for Menu (POST / PUT)
const menuValidator = [
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('itemName')
    .trim()
    .notEmpty().withMessage('Item name is required'),
  body('description')
    .optional()
    .trim()
    .isString().withMessage('Description must be a string'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number')
    .toFloat(),
  body('isAvailable')
    .optional()
    .isBoolean().withMessage('isAvailable must be a boolean')
    .toBoolean(),
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be a boolean')
    .toBoolean(),
  validate
];

// Validation rules for Gallery (POST)
const galleryValidator = [
  body('caption')
    .optional()
    .trim()
    .isString().withMessage('Caption must be a string'),
  validate
];

// Validation rules for Offer (POST / PUT)
const offerValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Offer title is required'),
  body('description')
    .optional()
    .trim()
    .isString().withMessage('Description must be a string'),
  body('expiryDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Expiry date must be a valid ISO 8601 date (YYYY-MM-DD)')
    .toDate(),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
    .toBoolean(),
  validate
];

// Validation rules for About (PUT)
const aboutValidator = [
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),
  validate
];

// Validation rules for Contact (PUT)
const contactValidator = [
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  body('email')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('openingHours')
    .trim()
    .notEmpty().withMessage('Opening hours are required'),
  body('instagram')
    .optional()
    .trim()
    .isString().withMessage('Instagram link must be a string'),
  body('facebook')
    .optional()
    .trim()
    .isString().withMessage('Facebook link must be a string'),
  body('whatsapp')
    .optional()
    .trim()
    .isString().withMessage('WhatsApp link must be a string'),
  body('googleMapsLink')
    .optional()
    .trim()
    .isString().withMessage('Google Maps link must be a string'),
  validate
];

module.exports = {
  loginValidator,
  bannerValidator,
  menuValidator,
  galleryValidator,
  offerValidator,
  aboutValidator,
  contactValidator
};
