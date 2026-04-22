const router = require('express').Router();
const c = require('../controllers/screeningController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);
router.post('/apply/:jobId', requireRole('applicant'), c.applyToJob);
router.get('/my-results', c.getMyResults);
router.get('/analytics', requireRole('employer'), c.getAnalytics);
router.get('/', requireRole('employer'), c.getAll);
router.post('/', requireRole('employer'), c.screen);
router.get('/:id', requireRole('employer'), c.getOne);
router.put('/:id/status', requireRole('employer'), c.updateStatus);
router.delete('/:id', requireRole('employer'), c.remove);

module.exports = router;
