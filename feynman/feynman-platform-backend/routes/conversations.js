// routes/conversations.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');

// 获取当前用户的所有对话列表
router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: { user_id: req.user.id },
      attributes: ['id', 'title', 'lastMessageAt'],
      order: [['lastMessageAt', 'DESC']], // 仅按 lastMessageAt 排序
    });
    res.json(conversations);
  } catch (error) {
    console.error('获取对话列表失败:', error);
    res.status(500).json({ msg: '获取对话列表失败', error: error.message });
  }
});

module.exports = router;

