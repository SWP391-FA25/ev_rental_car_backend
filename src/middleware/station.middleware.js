import { checkSchema } from 'express-validator';
import validate from '../utils/validation.js';

// Validate request to get vehicles available during a specific period
export const getVehiclesAtStationDuringPeriodValidator = checkSchema({
  stationId: {
    in: { options: [['body']] },
    notEmpty: true,
    isMongoId: true,
    errorMessage: 'Valid station ID is required',
  },
  startTime: {
    in: { options: [['body']] },
    notEmpty: true,
    isISO8601: true,
    errorMessage: 'Valid start time is required (ISO8601 format)',
  },
  endTime: {
    in: { options: [['body']] },
    notEmpty: true,
    isISO8601: true,
    errorMessage: 'Valid end time is required (ISO8601 format)',
    custom: {
      options: (endTime, { req }) => {
        if (endTime && req.body.startTime) {
          const startTime = new Date(req.body.startTime);
          const endTimeDate = new Date(endTime);
          if (isNaN(startTime) || isNaN(endTimeDate)) {
            throw new Error('Invalid date format for startTime or endTime');
          }
          if (endTimeDate <= startTime) {
            throw new Error('End time must be after start time');
          }
        }
        return true;
      },
    },
  },
});

// Middleware exports for easy use
export const getVehiclesAtStationDuringPeriodValidation = validate([getVehiclesAtStationDuringPeriodValidator]);
