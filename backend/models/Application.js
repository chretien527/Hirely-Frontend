const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  coverNote: { type: String, default: '' },
  resumeSnapshot: { type: String, default: '' },
  status: { type: String, enum: ['submitted', 'screened', 'shortlisted', 'interviewed', 'offered', 'rejected'], default: 'submitted' },
  screening: { type: mongoose.Schema.Types.ObjectId, ref: 'Screening', default: null },
}, { timestamps: true });

applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
