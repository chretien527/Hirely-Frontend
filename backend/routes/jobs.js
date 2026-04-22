const router = require('express').Router();
const c = require('../controllers/jobController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/public', c.getPublicJobs);
router.use(protect);
router.get('/dashboard-stats', requireRole('employer'), c.getDashboardStats);
router.get('/', requireRole('employer'), c.getMyJobs);
router.post('/', requireRole('employer'), c.createJob);
router.put('/:id', requireRole('employer'), c.updateJob);
router.delete('/:id', requireRole('employer'), c.deleteJob);

module.exports = router;
