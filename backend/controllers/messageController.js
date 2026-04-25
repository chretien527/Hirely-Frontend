const Conversation = require('../models/Conversation');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name role company jobTitle headline profileImage')
      .populate('messages.sender', 'name');
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const recipientId = req.body.recipientId;
    const body = req.body.body?.trim();
    if (!recipientId || !body) {
      return res.status(400).json({ success: false, message: 'Recipient and message body are required.' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        messages: [],
      });
    }

    conversation.messages.push({ sender: req.user._id, body, readBy: [req.user._id] });
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'name role company jobTitle headline profileImage')
      .populate('messages.sender', 'name');

    res.status(201).json({ success: true, conversation: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
