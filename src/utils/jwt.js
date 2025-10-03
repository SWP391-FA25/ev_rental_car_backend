import jwt from 'jsonwebtoken';

const generateToken = (payload, options) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, process.env.JWT_SECRET, options, (error, token) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
  });
};

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      resolve(decoded);
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      reject(error);
    }
  });
};

export { generateToken, verifyToken };
