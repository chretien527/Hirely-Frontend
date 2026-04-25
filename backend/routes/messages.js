const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/messageController');

router.use(protect);
router.get('/', c.getConversations);
router.post('/', c.sendMessage);

module.exports = router;
