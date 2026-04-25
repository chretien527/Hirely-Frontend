const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    transporter.preview = nodemailer.getTestMessageUrl;
  }
  return transporter;
};

const sendVerificationEmail = async (email, code) => {
  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || 'Hirely <no-reply@hirely.com>',
    to: email,
    subject: 'Your Hirely verification code',
    text: `Your Hirely verification code is ${code}. Enter it in the app to continue.`,
    html: `<p>Your Hirely verification code is <strong>${code}</strong>.</p><p>Enter it in the app to continue.</p>`,
  });
  return info;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, company, jobTitle } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    const verification = await EmailVerification.findOne({ email, purpose: 'register' });
    if (!verification || !verification.verified || verification.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Email must be verified before registration.' });
    }

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });

    const user = await User.create({ name, email, password, role, company: company || '', jobTitle: jobTitle || '' });
    await EmailVerification.deleteMany({ email, purpose: 'register' });
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

exports.requestEmailCode = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose)
      return res.status(400).json({ success: false, message: 'Email and purpose are required.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail))
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    if (!['register', 'login'].includes(purpose))
      return res.status(400).json({ success: false, message: 'Invalid verification purpose.' });

    if (purpose === 'register' && await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: 'This email is already registered.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await EmailVerification.findOneAndUpdate(
      { email: normalizedEmail, purpose },
      { email: normalizedEmail, purpose, code, verified: false, expiresAt, attempts: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const info = await sendVerificationEmail(normalizedEmail, code);
    let message = 'Verification code sent to your email.';
    if (info && info.messageId && transporter.preview) {
      const previewUrl = transporter.preview(info);
      if (previewUrl) message += ` Preview URL: ${previewUrl}`;
    }

    res.json({ success: true, message, email: normalizedEmail });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Unable to send verification email.' });
  }
};

exports.verifyEmailCode = async (req, res) => {
  try {
    const { email, purpose, code } = req.body;
    if (!email || !purpose || !code)
      return res.status(400).json({ success: false, message: 'Email, purpose, and code are required.' });

    const normalizedEmail = email.trim().toLowerCase();
    const record = await EmailVerification.findOne({ email: normalizedEmail, purpose });
    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ success: false, message: 'Verification code expired or not requested.' });
    if (record.code !== code)
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });

    record.verified = true;
    await record.save();
    res.json({ success: true, message: 'Email address verified.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Email verification failed.' });
  }
};

exports.getMe = (req, res) => res.json({ success: true, user: req.user });

exports.updateProfile = async (req, res) => {
  try {
    const fields = ['name','company','jobTitle','headline','industry','phone','location','bio','skills','linkedin','website','portfolioUrl','profileImage','featuredWork','interests','resumeText'];
    const updates = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
