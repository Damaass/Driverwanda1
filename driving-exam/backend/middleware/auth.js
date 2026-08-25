const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rnp_driving_exam_secret_2024';

module.exports = function(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Nta token ihari / No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token ntabwo ikora / Invalid token' });
  }
};
