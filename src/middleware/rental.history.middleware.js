import { checkSchema } from 'express-validator';
import validate from '../utils/validation.js';

// Create rental history validation
export const createRentalHistoryValidator = checkSchema({
  userId: {
    in: { options: [['body']] },
    notEmpty: true,
    isMongoId: true,
    errorMessage: 'Valid user ID is required',
  },
  bookingId: {
    in: { options: [['body']] },
    notEmpty: true,
    isMongoId: true,
    errorMessage: 'Valid booking ID is required',
  },
  distance: {
    in: { options: [['body']] },
    notEmpty: true,
    isFloat: {
      options: { min: 0 },
    },
    errorMessage: 'Distance is required and must be a non-negative number',
  },
  rating: {
    in: { options: [['body']] },
    notEmpty: true,
    isInt: {
      options: { min: 1, max: 5 },
    },
    errorMessage: 'Rating is required and must be an integer between 1 and 5',
  },
  feedback: {
    in: { options: [['body']] },
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: {
      options: { min: 1, max: 1000 },
    },
    errorMessage: 'Feedback is required and must be 1-1000 characters',
  },
});

// Get rental histories validation (query params)
export const getRentalHistoriesValidator = checkSchema({
  page: {
    in: { options: [['query']] },
    optional: true,
    isInt: {
      options: { min: 1 },
    },
    errorMessage: 'Page must be a positive integer',
  },
  limit: {
    in: { options: [['query']] },
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
    },
    errorMessage: 'Limit must be between 1 and 100',
  },
  userId: {
    in: { options: [['query']] },
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid user ID',
  },
  rating: {
    in: { options: [['query']] },
    optional: true,
    isInt: {
      options: { min: 1, max: 5 },
    },
    errorMessage: 'Rating must be an integer between 1 and 5',
  },
});

// Get rental history by ID validation
export const getRentalHistoryByIdValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid rental history ID',
  },
});

// Get rental histories by user ID validation
export const getRentalHistoriesByUserIdValidator = checkSchema({
  userId: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid user ID',
  },
  page: {
    in: { options: [['query']] },
    optional: true,
    isInt: {
      options: { min: 1 },
    },
    errorMessage: 'Page must be a positive integer',
  },
  limit: {
    in: { options: [['query']] },
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
    },
    errorMessage: 'Limit must be between 1 and 100',
  },
});

// Get rental history by booking ID validation
export const getRentalHistoryByBookingIdValidator = checkSchema({
  bookingId: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
});

// Update rental history validation
export const updateRentalHistoryValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid rental history ID',
  },
  distance: {
    in: { options: [['body']] },
    optional: true,
    isFloat: {
      options: { min: 0 },
    },
    errorMessage: 'Distance must be a non-negative number',
  },
  rating: {
    in: { options: [['body']] },
    optional: true,
    isInt: {
      options: { min: 1, max: 5 },
    },
    errorMessage: 'Rating must be an integer between 1 and 5',
  },
  feedback: {
    in: { options: [['body']] },
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { min: 1, max: 1000 },
    },
    errorMessage: 'Feedback must be 1-1000 characters',
  },
});

// Delete rental history validation
export const deleteRentalHistoryValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid rental history ID',
  },
});

// Get rental statistics validation
export const getRentalStatisticsValidator = checkSchema({
  userId: {
    in: { options: [['query']] },
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid user ID',
  },
});

// Middleware array exports for easy use
export const createRentalHistoryValidation = validate([createRentalHistoryValidator]);
export const getRentalHistoriesValidation = validate([getRentalHistoriesValidator]);
export const getRentalHistoryByIdValidation = validate([getRentalHistoryByIdValidator]);
export const getRentalHistoriesByUserIdValidation = validate([getRentalHistoriesByUserIdValidator]);
export const getRentalHistoryByBookingIdValidation = validate([getRentalHistoryByBookingIdValidator]);
export const updateRentalHistoryValidation = validate([updateRentalHistoryValidator]);
export const deleteRentalHistoryValidation = validate([deleteRentalHistoryValidator]);
export const getRentalStatisticsValidation = validate([getRentalStatisticsValidator]);