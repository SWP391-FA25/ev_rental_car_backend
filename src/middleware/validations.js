// Promise-based version of missingFields
const missingFieldsPromise = (...fields) => {
  return (req) =>
    new Promise((resolve, reject) => {
      const errors = [];
      fields.forEach((field) => {
        if (!req.body[field]) {
          errors.push(`${field} is required`);
        }
      });
      if (errors.length > 0) {
        return reject({ status: 400, body: { success: false, errors } });
      }
      resolve();
    });
};

// Promise-based version of validateDateRange
const validateDateRangePromise = (startField, endField) => {
  return (req) =>
    new Promise((resolve, reject) => {
      const errors = [];
      [startField, endField].forEach((field) => {
        if (!req.body[field]) {
          errors.push(`${field} is required`);
        }
      });
      if (errors.length > 0) {
        return reject({ status: 400, body: { success: false, errors } });
      }

      const startDate = new Date(req.body[startField]);
      const endDate = new Date(req.body[endField]);

      if (isNaN(startDate) || isNaN(endDate)) {
        return reject({
          status: 400,
          body: { success: false, message: 'Invalid date format' },
        });
      }

      if (startDate >= endDate) {
        req.body[startField] = endDate;
        req.body[endField] = startDate;
      } else {
        req.body[startField] = startDate;
        req.body[endField] = endDate;
      }

      resolve();
    });
};

export { missingFieldsPromise, validateDateRangePromise };
