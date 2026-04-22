const jwt = require('jsonwebtoken');
const User = require('../models/User');

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, company, jobTitle } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    const user = await User.create({ name, email, password, role, company: company || '', jobTitle: jobTitle || '' });
    res.status(201).json({ success: true, token: makeToken(user._id), user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (role && user.role !== role)
      return res.status(403).json({ success: false, message: `This account is registered as "${user.role}". Please select the correct account type.` });
    user.password = undefined;
    res.json({ success: true, token: makeToken(user._id), user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = (req, res) => res.json({ success: true, user: req.user });

exports.updateProfile = async (req, res) => {
  try {
    const fields = ['name','company','jobTitle','industry','phone','location','bio','skills','linkedin','resumeText'];
    const updates = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
