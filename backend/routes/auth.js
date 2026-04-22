// routes/auth.js
const r1 = require('express').Router();
const a = require('../controllers/authController');
const { protect } = require('../middleware/auth');
r1.post('/register', a.register);
r1.post('/login', a.login);
r1.get('/me', protect, a.getMe);
r1.put('/profile', protect, a.updateProfile);
module.exports = r1;
