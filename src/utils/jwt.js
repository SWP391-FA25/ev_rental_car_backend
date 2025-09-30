import jwt from 'jsonwebtoken';

const generateToken = (payload) => {
  if (!payload) {
    throw new Error('Payload is required to generate a token');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '5m',
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.log(error);
    return '';
  }
};
export { generateToken, verifyToken };
