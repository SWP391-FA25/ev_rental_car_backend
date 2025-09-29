import { checkSchema } from 'express-validator';
import validate from '../utils/validation.js';

// Create promotion validation
export const createPromotionValidator = checkSchema({
  code: {
    in: { options: [['body']] },
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 50 },
    },
    errorMessage: 'Code is required and must be 2-50 characters',
  },
  description: {
    in: { options: [['body']] },
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { max: 500 },
    },
    errorMessage: 'Description must not exceed 500 characters',
  },
  discount: {
    in: { options: [['body']] },
    notEmpty: true,
    isFloat: {
      options: { min: 0.01 },
    },
    errorMessage: 'Discount is required and must be a positive number',
  },
  validFrom: {
    in: { options: [['body']] },
    notEmpty: true,
    isISO8601: true,
    errorMessage: 'Valid from date is required (ISO8601 format)',
  },
  validUntil: {
    in: { options: [['body']] },
    notEmpty: true,
    isISO8601: true,
    errorMessage: 'Valid until date is required (ISO8601 format)',
    custom: {
      options: (validUntil, { req }) => {
        if (validUntil && req.body.validFrom) {
          const validFrom = new Date(req.body.validFrom);
          const validUntilDate = new Date(validUntil);
          if (validFrom >= validUntilDate) {
            throw new Error('Valid until date must be after valid from date');
          }
        }
        return true;
      },
    },
  },
});

// Get promotion by ID validation
export const getPromotionByIdValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid promotion ID',
  },
});

// Get promotion by code validation
export const getPromotionByCodeValidator = checkSchema({
  code: {
    in: { options: [['params']] },
    notEmpty: true,
    isString: true,
    trim: true,
    errorMessage: 'Valid promotion code is required',
  },
});

// Update promotion validation
export const updatePromotionValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid promotion ID',
  },
  code: {
    in: { options: [['body']] },
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 50 },
    },
    errorMessage: 'Code must be 2-50 characters',
  },
  description: {
    in: { options: [['body']] },
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { max: 500 },
    },
    errorMessage: 'Description must not exceed 500 characters',
  },
  discount: {
    in: { options: [['body']] },
    optional: true,
    isFloat: {
      options: { min: 0.01 },
    },
    errorMessage: 'Discount must be a positive number',
  },
  validFrom: {
    in: { options: [['body']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'Valid from date must be in ISO8601 format',
  },
  validUntil: {
    in: { options: [['body']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'Valid until date must be in ISO8601 format',
    custom: {
      options: (validUntil, { req }) => {
        if (validUntil && req.body.validFrom) {
          const validFrom = new Date(req.body.validFrom);
          const validUntilDate = new Date(validUntil);
          if (validFrom >= validUntilDate) {
            throw new Error('Valid until date must be after valid from date');
          }
        }
        return true;
      },
    },
  },
});

// Delete promotion validation
export const deletePromotionValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid promotion ID',
  },
});

// Middleware array exports for easy use
export const createPromotionValidation = validate([createPromotionValidator]);
export const getPromotionByIdValidation = validate([getPromotionByIdValidator]);
export const getPromotionByCodeValidation = validate([
  getPromotionByCodeValidator,
]);
export const updatePromotionValidation = validate([updatePromotionValidator]);
export const deletePromotionValidation = validate([deletePromotionValidator]);
