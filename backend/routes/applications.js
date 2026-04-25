const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const c = require('../controllers/applicationController');

router.use(protect);
router.post('/:jobId', requireRole('applicant'), c.apply);
router.get('/mine', requireRole('applicant'), c.getMine);
router.get('/inbox', requireRole('employer'), c.getEmployerInbox);
router.post('/:id/screen', requireRole('employer'), c.screenApplication);
router.put('/:id/status', requireRole('employer'), c.updateApplicationStatus);

module.exports = router;
