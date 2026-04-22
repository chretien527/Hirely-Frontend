const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  department:     { type: String, required: true },
  location:       { type: String, required: true },
  type:           { type: String, enum: ['Full-time','Part-time','Contract','Internship'], default: 'Full-time' },
  salary:         { type: String, default: '' },
  description:    { type: String, required: true },
  requirements:   { type: String, default: '' },
  skills:         [String],
  status:         { type: String, enum: ['active','paused','closed'], default: 'active' },
  employer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicantCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
