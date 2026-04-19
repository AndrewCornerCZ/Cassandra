const jwt = require('jwt-simple');
const SECRET = process.env.JWT_SECRET || 'tvoje-tajne-klic-zmeni-na-produkcji';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const decoded = jwt.decode(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const generateToken = (user) => {
  return jwt.encode(
    {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      doctor_id: user.doctor_id,
      iat: new Date().getTime(),
      exp: new Date().getTime() + 24 * 60 * 60 * 1000, // 24 hours
    },
    SECRET
  );
};

module.exports = { authMiddleware, generateToken };
