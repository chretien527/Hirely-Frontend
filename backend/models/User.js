const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true, minlength: 6, select: false },
  role:       { type: String, enum: ['employer', 'applicant'], required: true },
  company:    { type: String, default: '' },
  jobTitle:   { type: String, default: '' },
  industry:   { type: String, default: '' },
  phone:      { type: String, default: '' },
  location:   { type: String, default: '' },
  bio:        { type: String, default: '' },
  skills:     [String],
  linkedin:   { type: String, default: '' },
  resumeText: { type: String, default: '' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
