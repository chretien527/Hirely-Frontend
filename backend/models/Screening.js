const mongoose = require('mongoose');

const factorSchema = new mongoose.Schema({
  name: String, score: Number, weight: Number, note: String
}, { _id: false });

const screeningSchema = new mongoose.Schema({
  applicantName:   { type: String, required: true },
  applicantEmail:  { type: String, default: '' },
  role:            { type: String, required: true },
  resumeText:      { type: String, required: true },
  overallScore:    { type: Number, required: true, min: 0, max: 100 },
  verdict:         { type: String, enum: ['Advance','Review','Decline'], required: true },
  summary:         { type: String, default: '' },
  factorScores:    [factorSchema],
  aiReasoning:     [String],
  strengths:       [String],
  concerns:        [String],
  interviewQuestions: [String],
  usedFactors:     [{ name: String, weight: Number }],
  applicant:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  employer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job:             { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  application:     { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
  hrStatus:        { type: String, enum: ['pending','shortlisted','interviewed','offered','rejected'], default: 'pending' },
  hrNotes:         { type: String, default: '' },
  screenedAt:      { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Screening', screeningSchema);
