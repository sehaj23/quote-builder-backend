import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ApiResponse } from '../types/index.js';

// Validation result handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      data: errors.array()
    };
    
    res.status(400).json(response);
    return;
  }
  
  next();
};

// Company validation rules
export const validateCreateCompany = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Company name must be between 1 and 255 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must be less than 50 characters'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Address must be less than 1000 characters'),
  
  body('terms')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Terms must be less than 2000 characters'),
  
  body('logo_path')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Logo path must be less than 500 characters'),
  
  handleValidationErrors
];

export const validateUpdateCompany = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Company name must be between 1 and 255 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must be less than 50 characters'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Address must be less than 1000 characters'),
  
  body('terms')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Terms must be less than 2000 characters'),
  
  body('logo_path')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Logo path must be less than 500 characters'),
  
  handleValidationErrors
];

// ID parameter validation
export const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  handleValidationErrors
];

// Item validation rules
export const validateCreateItem = [
  body('company_id')
    .isInt({ min: 1 })
    .withMessage('Company ID must be a positive integer'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Item name must be between 1 and 255 characters'),
  
  body('unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit must be between 1 and 50 characters'),
  
  body('unit_cost')
    .isNumeric()
    .withMessage('Unit cost must be a number')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Unit cost must be non-negative');
      }
      return true;
    }),
  
  body('default_area')
    .optional()
    .isNumeric()
    .withMessage('Default area must be a number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Default area must be positive');
      }
      return true;
    }),
  
  body('economy_unit_cost')
    .optional()
    .isNumeric()
    .withMessage('Economy unit cost must be a number'),
  
  body('luxury_unit_cost')
    .optional()
    .isNumeric()
    .withMessage('Luxury unit cost must be a number'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  
  handleValidationErrors
];

// Quote validation rules
export const validateCreateQuote = [
  body('company_id')
    .isInt({ min: 1 })
    .withMessage('Company ID must be a positive integer'),
  
  body('quote_number')
    .trim()
    .notEmpty()
    .withMessage('Quote number is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Quote number must be between 1 and 100 characters'),
  
  body('tier')
    .optional()
    .isIn(['economy', 'standard', 'luxury'])
    .withMessage('Tier must be economy, standard, or luxury'),
  
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'approved', 'rejected'])
    .withMessage('Status must be draft, sent, approved, or rejected'),
  
  body('customer_email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid customer email address')
    .normalizeEmail(),
  
  body('lines')
    .isArray({ min: 1 })
    .withMessage('At least one quote line is required'),
  
  body('lines.*.item_id')
    .isInt({ min: 1 })
    .withMessage('Item ID must be a positive integer'),
  
  body('lines.*.quantity')
    .optional()
    .isNumeric()
    .withMessage('Quantity must be a number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Quantity must be positive');
      }
      return true;
    }),
  
  handleValidationErrors
];