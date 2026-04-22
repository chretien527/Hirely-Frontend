const Screening = require('../models/Screening');
const Job = require('../models/Job');
const fetch = require('node-fetch');

const DEFAULT_FACTORS = [
  { name: 'Technical Skills', weight: 30 },
  { name: 'Relevant Experience', weight: 25 },
  { name: 'Education & Credentials', weight: 15 },
  { name: 'Communication Clarity', weight: 10 },
  { name: 'Leadership & Initiative', weight: 10 },
  { name: 'Cultural Fit', weight: 10 },
];

const cleanText = (value = '') => value.replace(/\r\n/g, '\n').trim();

const buildFactorList = (factors) => factors.map(f => `  - ${f.name}: ${f.weight}% of total score`).join('\n');

const buildRoleContext = (job, role) => {
  if (!job) return '';

  const sections = [
    `JOB TITLE: ${job.title}`,
    `DEPARTMENT: ${job.department || 'Not specified'}`,
    `LOCATION: ${job.location || 'Not specified'}`,
    `EMPLOYMENT TYPE: ${job.type || 'Not specified'}`,
    `JOB DESCRIPTION:\n${cleanText(job.description || 'Not provided')}`,
    `REQUIREMENTS:\n${cleanText(job.requirements || 'Not provided')}`,
  ];

  if (job.skills?.length) {
    sections.push(`PRIORITY SKILLS: ${job.skills.join(', ')}`);
  }

  if (role && role !== job.title) {
    sections.push(`ROLE LABEL USED IN SCREENING: ${role}`);
  }

  return sections.join('\n\n');
};

const buildApplicantFacts = (user) => {
  const facts = [];
  if (user.bio) facts.push(`Professional summary: ${user.bio}`);
  if (user.jobTitle) facts.push(`Current title: ${user.jobTitle}`);
  if (user.company) facts.push(`Current organisation: ${user.company}`);
  if (user.location) facts.push(`Location: ${user.location}`);
  if (user.phone) facts.push(`Phone: ${user.phone}`);
  if (user.linkedin) facts.push(`LinkedIn: ${user.linkedin}`);
  if (user.skills?.length) facts.push(`Skills: ${user.skills.join(', ')}`);
  return facts;
};

const buildResumeTextFromUser = (user) => {
  const sections = [];
  const resumeText = cleanText(user.resumeText || '');
  const facts = buildApplicantFacts(user);

  if (resumeText) sections.push(resumeText);
  if (facts.length) sections.push(`PROFILE FACTS:\n${facts.join('\n')}`);

  return sections.join('\n\n').trim();
};

async function runAiEvaluation({ applicantName, applicantEmail, role, resumeText, factors, job }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Server AI key not configured. Add ANTHROPIC_API_KEY to .env');
  }

  const factorList = buildFactorList(factors);
  const roleContext = buildRoleContext(job, role);

  const prompt = `You are a senior executive recruiter conducting a rigorous hiring review.

POSITION APPLIED FOR: ${role}

EVALUATION FRAMEWORK (weighted scoring criteria):
${factorList}

APPLICANT NAME: ${applicantName}
EMAIL: ${applicantEmail || 'Not provided'}

${roleContext ? `TARGET ROLE CONTEXT:\n${roleContext}\n\n` : ''}RESUME / CURRICULUM VITAE:
---
${resumeText}
---

EVALUATION INSTRUCTIONS:
1. Score each factor from 0 to 100 based only on evidence in the resume and the target role context.
2. Compute the weighted overall score precisely as sum of (factor score x weight / 100).
3. Write a formal 3-4 sentence executive summary.
4. Document your reasoning with concrete facts from the applicant profile and the job requirements.
5. Identify strengths and concerns that are specific and evidence-based.
6. Propose targeted interview questions based on the gaps you observed.

Respond only with valid JSON:
{
  "overallScore": <integer 0-100>,
  "verdict": "<Advance|Review|Decline>",
  "summary": "<formal executive summary, 3-4 sentences>",
  "factorScores": {
    ${factors.map(f => `"${f.name}": { "score": <integer 0-100>, "note": "<formal 1-2 sentence evaluation>" }`).join(',\n    ')}
  },
  "aiReasoning": [
    "1. Resume and evidence quality assessment - <detailed finding>",
    "2. Match against the role requirements - <detailed finding>",
    "3. Experience relevance and seniority review - <detailed finding>",
    "4. Skills and credentials review - <detailed finding>",
    "5. Communication and professionalism signals - <detailed finding>",
    "6. Weighted score computation - <detailed finding>",
    "7. Verdict rationale - <detailed finding>"
  ],
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "concerns": ["<specific concern 1>", "<specific concern 2>"],
  "interviewQuestions": [
    "<targeted question 1>",
    "<targeted question 2>",
    "<targeted question 3>"
  ]
}

Verdict thresholds: Advance >= 75 | Review 50-74 | Decline < 50`;

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: 'You are a senior executive talent evaluator. Output only valid JSON.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    throw new Error(`AI service error: ${errText}`);
  }

  const aiData = await aiRes.json();
  const rawText = aiData.content.map(block => block.text || '').join('').replace(/```json|```/g, '').trim();
  return JSON.parse(rawText);
}

async function createScreeningRecord({ applicantName, applicantEmail, role, resumeText, factors, employerId, job }) {
  const result = await runAiEvaluation({ applicantName, applicantEmail, role, resumeText, factors, job });

  const factorScoresArr = factors.map(f => ({
    name: f.name,
    weight: f.weight,
    score: result.factorScores?.[f.name]?.score ?? 0,
    note: result.factorScores?.[f.name]?.note ?? '',
  }));

  const screening = await Screening.create({
    applicantName,
    applicantEmail: applicantEmail || '',
    role,
    resumeText,
    overallScore: result.overallScore,
    verdict: result.verdict,
    summary: result.summary,
    factorScores: factorScoresArr,
    aiReasoning: result.aiReasoning || [],
    strengths: result.strengths || [],
    concerns: result.concerns || [],
    interviewQuestions: result.interviewQuestions || [],
    usedFactors: factors,
    employer: employerId,
    job: job?._id || null,
  });

  if (job?._id) {
    await Job.findByIdAndUpdate(job._id, { $inc: { applicantCount: 1 } });
  }

  return screening;
}

exports.screen = async (req, res) => {
  try {
    const { applicantName, applicantEmail, role, resumeText, factors, jobId } = req.body;
    if (!applicantName || !role || !resumeText) {
      return res.status(400).json({ success: false, message: 'Name, role, and resume text are required.' });
    }

    const activeFactors = factors && factors.length ? factors : DEFAULT_FACTORS;
    const job = jobId ? await Job.findById(jobId) : null;
    const screening = await createScreeningRecord({
      applicantName,
      applicantEmail,
      role,
      resumeText,
      factors: activeFactors,
      employerId: req.user._id,
      job,
    });

    res.status(201).json({ success: true, screening });
  } catch (err) {
    console.error('[SCREEN]', err);
    res.status(err.message.startsWith('AI service error:') ? 502 : 500).json({ success: false, message: err.message || 'Screening failed.' });
  }
};

exports.applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOne({ _id: jobId, status: 'active' }).populate('employer', '_id name company');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Active job not found.' });
    }

    const existing = await Screening.findOne({ job: job._id, applicantEmail: req.user.email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied to this job.', screening: existing });
    }

    const resumeText = buildResumeTextFromUser(req.user);
    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'Add your resume or profile details before applying.' });
    }

    const screening = await createScreeningRecord({
      applicantName: req.user.name,
      applicantEmail: req.user.email,
      role: job.title,
      resumeText,
      factors: DEFAULT_FACTORS,
      employerId: job.employer._id,
      job,
    });

    res.status(201).json({
      success: true,
      screening,
      message: `Application submitted to ${job.employer.company || job.employer.name} and screened immediately.`,
    });
  } catch (err) {
    console.error('[APPLY]', err);
    res.status(err.message.startsWith('AI service error:') ? 502 : 500).json({ success: false, message: err.message || 'Application failed.' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const filter = { employer: req.user._id };
    if (req.query.verdict) filter.verdict = req.query.verdict;
    if (req.query.role) filter.role = { $regex: req.query.role, $options: 'i' };
    const screenings = await Screening.find(filter).sort({ overallScore: -1, createdAt: -1 }).populate('job', 'title');
    res.json({ success: true, screenings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const s = await Screening.findOne({ _id: req.params.id, employer: req.user._id }).populate('job', 'title');
    if (!s) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, screening: s });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const s = await Screening.findOneAndUpdate(
      { _id: req.params.id, employer: req.user._id },
      { hrStatus: req.body.hrStatus, hrNotes: req.body.hrNotes },
      { new: true }
    );
    if (!s) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, screening: s });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const s = await Screening.findOneAndDelete({ _id: req.params.id, employer: req.user._id });
    if (!s) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const all = await Screening.find({ employer: req.user._id });
    const total = all.length;
    const advance = all.filter(s => s.verdict === 'Advance').length;
    const review = all.filter(s => s.verdict === 'Review').length;
    const decline = all.filter(s => s.verdict === 'Decline').length;
    const avg = total ? Math.round(all.reduce((sum, item) => sum + item.overallScore, 0) / total) : 0;

    const dist = [
      { range: '0-24', count: all.filter(s => s.overallScore < 25).length },
      { range: '25-49', count: all.filter(s => s.overallScore >= 25 && s.overallScore < 50).length },
      { range: '50-74', count: all.filter(s => s.overallScore >= 50 && s.overallScore < 75).length },
      { range: '75-89', count: all.filter(s => s.overallScore >= 75 && s.overallScore < 90).length },
      { range: '90-100', count: all.filter(s => s.overallScore >= 90).length },
    ];

    const factorMap = {};
    all.forEach(s => s.factorScores.forEach(f => {
      if (!factorMap[f.name]) factorMap[f.name] = [];
      factorMap[f.name].push(f.score);
    }));

    const factorAverages = Object.entries(factorMap).map(([name, scores]) => ({
      name,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    res.json({ success: true, analytics: { total, advance, review, decline, avg, advanceRate: total ? Math.round((advance / total) * 100) : 0, dist, factorAverages } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyResults = async (req, res) => {
  try {
    const email = req.user?.role === 'applicant' ? req.user.email : req.query.email;
    if (!email) return res.status(400).json({ success: false, message: 'Email required.' });
    const screenings = await Screening.find({ applicantEmail: email }).sort({ createdAt: -1 }).populate('job', 'title department');
    res.json({ success: true, screenings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
