const Application = require('../models/Application');
const Job = require('../models/Job');
const Screening = require('../models/Screening');
const { createScreeningRecord, DEFAULT_FACTORS } = require('./screeningController');

const applicationPopulate = [
  { path: 'applicant', select: 'name email role company jobTitle headline industry location bio skills linkedin website portfolioUrl profileImage featuredWork interests resumeText followers following followerCount followingCount' },
  { path: 'job', select: 'title department location type salary description requirements skills status' },
  { path: 'screening' },
];

exports.apply = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, status: 'active' });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Active job not found.' });
    }

    const existing = await Application.findOne({ applicant: req.user._id, job: job._id }).populate(applicationPopulate);
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied to this job.', application: existing });
    }

    const resumeSnapshot = [req.user.resumeText, req.user.bio, (req.user.skills || []).join(', ')].filter(Boolean).join('\n\n').trim();
    if (!resumeSnapshot) {
      return res.status(400).json({ success: false, message: 'Add your profile, skills, or resume before applying.' });
    }

    const application = await Application.create({
      applicant: req.user._id,
      employer: job.employer,
      job: job._id,
      coverNote: req.body.coverNote || '',
      resumeSnapshot,
    });

    await Job.findByIdAndUpdate(job._id, { $inc: { applicantCount: 1 } });
    const populated = await Application.findById(application._id).populate(applicationPopulate);
    res.status(201).json({ success: true, application: populated, message: 'Application submitted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Application failed.' });
  }
};

exports.getMine = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .sort({ createdAt: -1 })
      .populate(applicationPopulate);
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEmployerInbox = async (req, res) => {
  try {
    const filter = { employer: req.user._id };
    if (req.query.jobId) filter.job = req.query.jobId;
    if (req.query.status) filter.status = req.query.status;

    const applications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .populate(applicationPopulate);

    const groupedByJob = applications.reduce((acc, item) => {
      const key = String(item.job?._id || 'unassigned');
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const ranked = Object.values(groupedByJob).flatMap(group =>
      group
        .filter(item => item.screening)
        .sort((a, b) => (b.screening?.overallScore || 0) - (a.screening?.overallScore || 0))
        .map((item, index) => ({
          applicationId: item._id,
          rank: index + 1,
          applicantId: item.applicant?._id,
          jobId: item.job?._id,
        }))
    );

    const shortlists = Object.entries(groupedByJob).map(([jobKey, group]) => {
      const job = group[0]?.job || null;
      const shortlisted = group
        .filter(item => item.status === 'shortlisted' || item.screening?.hrStatus === 'shortlisted')
        .sort((a, b) => (b.screening?.overallScore || 0) - (a.screening?.overallScore || 0));

      return {
        jobId: jobKey,
        job,
        shortlisted,
        screenedCount: group.filter(item => item.screening).length,
        applicantCount: group.length,
      };
    });

    res.json({ success: true, applications, ranked, shortlists });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.screenApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, employer: req.user._id })
      .populate({ path: 'applicant', select: 'name email bio jobTitle company headline location phone linkedin skills resumeText profileImage' })
      .populate({ path: 'job' })
      .populate('screening');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.screening) {
      return res.json({ success: true, screening: application.screening, application, message: 'Application already screened.' });
    }

    const resumeText = application.resumeSnapshot || application.applicant.resumeText || application.applicant.bio || [
      application.applicant.headline,
      application.applicant.jobTitle,
      application.applicant.company,
      application.applicant.location,
      (application.applicant.skills || []).join(', '),
    ].filter(Boolean).join('\n\n').trim();

    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'This applicant does not have enough profile data to screen.' });
    }

    const screening = await createScreeningRecord({
      applicantName: application.applicant.name,
      applicantEmail: application.applicant.email,
      role: application.job.title,
      resumeText,
      factors: DEFAULT_FACTORS,
      employerId: req.user._id,
      job: application.job,
      incrementApplicantCount: false,
    });

    screening.applicant = application.applicant._id;
    screening.application = application._id;
    await screening.save();

    application.screening = screening._id;
    application.status = screening.hrStatus === 'pending' ? 'screened' : screening.hrStatus;
    await application.save();

    const populated = await Application.findById(application._id).populate(applicationPopulate);
    res.json({ success: true, screening, application: populated, message: 'Applicant screened successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Screening failed.' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, employer: req.user._id },
      { status: req.body.status },
      { new: true }
    ).populate(applicationPopulate);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.screening) {
      await Screening.findByIdAndUpdate(application.screening._id, { hrStatus: req.body.status });
    }

    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
