const jwt = require('jsonwebtoken');
const User = require('../Models/user');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, mobilenumber, password, role } = req.body;
    const existing = await User.findOne({ mobilenumber });
    if (existing) return res.status(400).json({ success: false, message: 'User already exists' });

    const user = await User.create({ name, mobilenumber, password, role });
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, mobilenumber: user.mobilenumber, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { mobilenumber, password } = req.body;
    const user = await User.findOne({ mobilenumber });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, mobilenumber: user.mobilenumber, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};