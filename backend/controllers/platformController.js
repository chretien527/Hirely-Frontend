const User = require('../models/User');
const Post = require('../models/Post');
const Job = require('../models/Job');
const Application = require('../models/Application');

const userProjection = 'name email role company jobTitle headline industry location bio skills linkedin website portfolioUrl profileImage featuredWork interests followers following followerCount followingCount createdAt';

const withConnectionMeta = (viewerId, user) => {
  const item = user.toObject ? user.toObject() : { ...user };
  const followerIds = (item.followers || []).map(id => String(id));
  const followingIds = (item.following || []).map(id => String(id));
  item.followerCount = item.followerCount ?? followerIds.length;
  item.followingCount = item.followingCount ?? followingIds.length;
  item.isFollowing = followerIds.includes(String(viewerId));
  item.followingViewer = followingIds.includes(String(viewerId));
  return item;
};

exports.getHome = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select(userProjection);
    const networkIds = [req.user._id, ...(me.following || [])];
    const feed = await Post.find({ author: { $in: networkIds } })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('author', userProjection)
      .populate('comments.author', 'name role company jobTitle');

    const suggestedUsers = await User.find({ _id: { $ne: req.user._id } })
      .sort({ createdAt: -1 })
      .limit(8)
      .select(userProjection);

    const jobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 }).limit(6).populate('employer', 'name company');
    const stats = {
      members: await User.countDocuments(),
      posts: await Post.countDocuments(),
      jobs: await Job.countDocuments({ status: 'active' }),
      connections: (me.followerCount || 0) + (me.followingCount || 0),
    };

    res.json({
      success: true,
      me: withConnectionMeta(req.user._id, me),
      stats,
      feed,
      suggestedUsers: suggestedUsers.map(user => withConnectionMeta(req.user._id, user)),
      jobs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const filter = { _id: { $ne: req.user._id } };
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } },
        { jobTitle: { $regex: req.query.search, $options: 'i' } },
        { headline: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.role) filter.role = req.query.role;

    const members = await User.find(filter).sort({ createdAt: -1 }).limit(40).select(userProjection);
    res.json({ success: true, members: members.map(user => withConnectionMeta(req.user._id, user)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('following');
    const following = await User.find({ _id: { $in: me.following || [] } })
      .sort({ name: 1 })
      .select(userProjection);
    res.json({ success: true, following: following.map(user => withConnectionMeta(req.user._id, user)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleFollow = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    const me = await User.findById(req.user._id);
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Member not found.' });

    const isFollowing = me.following.some(id => String(id) === String(target._id));
    if (isFollowing) {
      me.following = me.following.filter(id => String(id) !== String(target._id));
      target.followers = target.followers.filter(id => String(id) !== String(me._id));
      me.followingCount = Math.max((me.followingCount || me.following.length + 1) - 1, 0);
      target.followerCount = Math.max((target.followerCount || target.followers.length + 1) - 1, 0);
    } else {
      me.following = [...new Set([...me.following.map(id => String(id)), String(target._id)])];
      target.followers = [...new Set([...target.followers.map(id => String(id)), String(me._id)])];
      me.followingCount = (me.followingCount ?? me.following.length - 1) + 1;
      target.followerCount = (target.followerCount ?? target.followers.length - 1) + 1;
    }

    await me.save();
    await target.save();

    res.json({
      success: true,
      following: !isFollowing,
      viewer: withConnectionMeta(req.user._id, await User.findById(req.user._id).select(userProjection)),
      member: withConnectionMeta(req.user._id, await User.findById(target._id).select(userProjection)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const body = req.body.body?.trim() || '';
    const mediaUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : req.body.mediaUrl || '';
    const mediaName = req.file ? req.file.originalname : req.body.mediaName || '';
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags.filter(Boolean)
      : typeof req.body.tags === 'string'
        ? req.body.tags.split(',').map(item => item.trim()).filter(Boolean)
        : [];

    if (!body && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Add text or media before posting.' });
    }

    const mediaType = req.file
      ? req.body.mediaType || (req.file.mimetype.startsWith('video/') ? 'video' : req.file.mimetype.startsWith('image/') ? 'image' : 'document')
      : req.body.mediaType || '';

    const post = await Post.create({
      author: req.user._id,
      body,
      resourceLink: req.body.resourceLink || '',
      projectTitle: req.body.projectTitle || '',
      tags,
      mediaType,
      mediaUrl,
      mediaName,
      mediaPoster: req.body.mediaPoster || '',
    });

    const populated = await Post.findById(post._id).populate('author', userProjection).populate('comments.author', 'name role company jobTitle');
    res.status(201).json({ success: true, post: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const existing = post.likes.find(id => String(id) === String(req.user._id));
    if (existing) {
      post.likes = post.likes.filter(id => String(id) !== String(req.user._id));
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();

    const populated = await Post.findById(post._id).populate('author', userProjection).populate('comments.author', 'name role company jobTitle');
    res.json({ success: true, post: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const existing = post.bookmarks.find(id => String(id) === String(req.user._id));
    if (existing) {
      post.bookmarks = post.bookmarks.filter(id => String(id) !== String(req.user._id));
    } else {
      post.bookmarks.push(req.user._id);
    }
    await post.save();

    const populated = await Post.findById(post._id).populate('author', userProjection).populate('comments.author', 'name role company jobTitle');
    res.json({ success: true, post: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (!req.body.content?.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty.' });

    post.comments.push({ author: req.user._id, content: req.body.content.trim() });
    await post.save();

    const populated = await Post.findById(post._id).populate('author', userProjection).populate('comments.author', 'name role company jobTitle');
    res.json({ success: true, post: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const original = await Post.findById(req.params.id).populate('author', 'name');
    if (!original) return res.status(404).json({ success: false, message: 'Post not found.' });

    original.shares += 1;
    await original.save();

    const shared = await Post.create({
      author: req.user._id,
      body: req.body.body?.trim() || `Shared from ${original.author.name}: ${original.body}`,
      resourceLink: original.resourceLink,
      projectTitle: original.projectTitle,
      tags: original.tags,
      mediaType: original.mediaType,
      mediaUrl: original.mediaUrl,
      mediaName: original.mediaName,
      mediaPoster: original.mediaPoster,
    });

    const populated = await Post.findById(shared._id).populate('author', userProjection).populate('comments.author', 'name role company jobTitle');
    res.status(201).json({ success: true, post: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'You can only delete your own posts.' });
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(userProjection);
    if (!user) return res.status(404).json({ success: false, message: 'Member not found.' });

    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 }).limit(8).populate('author', userProjection).populate('comments.author', 'name role company jobTitle');
    const applicationStats = user.role === 'employer'
      ? { openJobs: await Job.countDocuments({ employer: user._id, status: 'active' }), applicants: await Application.countDocuments({ employer: user._id }) }
      : { applications: await Application.countDocuments({ applicant: user._id }), screened: await Application.countDocuments({ applicant: user._id, screening: { $ne: null } }) };

    res.json({ success: true, profile: withConnectionMeta(req.user._id, user), posts, applicationStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
