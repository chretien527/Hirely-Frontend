const Job = require('../models/Job');
const Screening = require('../models/Screening');

exports.getMyJobs = async (req, res) => {
  try {
    const filter = { employer: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { department: { $regex: req.query.search, $options: 'i' } }
    ];
    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPublicJobs = async (req, res) => {
  try {
    const filter = { status: 'active' };
    if (req.query.search) filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { department: { $regex: req.query.search, $options: 'i' } }
    ];
    const jobs = await Job.find(filter).populate('employer', 'name company').sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, employer: req.user._id });
    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, employer: req.user._id },
      req.body, { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, employer: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.json({ success: true, message: 'Job listing removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id });
    const screenings = await Screening.find({ employer: req.user._id });
    const advance = screenings.filter(s => s.verdict === 'Advance').length;
    const review = screenings.filter(s => s.verdict === 'Review').length;
    const decline = screenings.filter(s => s.verdict === 'Decline').length;
    const avgScore = screenings.length
      ? Math.round(screenings.reduce((a, b) => a + b.overallScore, 0) / screenings.length) : 0;
    const recentScreenings = await Screening.find({ employer: req.user._id })
      .sort({ createdAt: -1 }).limit(5);
    res.json({
      success: true,
      stats: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active').length,
        totalScreenings: screenings.length,
        advance, review, decline, avgScore,
        advanceRate: screenings.length ? Math.round((advance / screenings.length) * 100) : 0,
      },
      recentScreenings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
