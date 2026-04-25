const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/platformController');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../uploads'));

const mediaStorage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${basename}-${Date.now()}${extension}`);
  },
});

const upload = multer({
  storage: mediaStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
});

router.use(protect);
router.get('/home', c.getHome);
router.post('/posts', upload.single('mediaFile'), c.createPost);
router.get('/members', c.getMembers);
router.get('/profile/:id', c.getProfile);
router.post('/follow/:id', c.toggleFollow);
router.post('/posts/:id/like', c.toggleLike);
router.post('/posts/:id/bookmark', c.toggleBookmark);
router.post('/posts/:id/comment', c.addComment);
router.post('/posts/:id/share', c.sharePost);
router.get('/following', c.getFollowing);
router.delete('/posts/:id', c.deletePost);

module.exports = router;
