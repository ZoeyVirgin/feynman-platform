// routes/audio.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { transcribeAudio } = require('../controllers/BaiduAiController');
const { evaluateFeynmanAttempt } = require('../controllers/deepseekAiController');

// 配置multer（内存存储）
const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/audio/transcribe
// @desc    上传音频并进行语音识别（百度ASR保留）
// @access  Private
router.post(
  '/transcribe',
  auth,
  upload.single('audio'),
  transcribeAudio
);

// @route   POST /api/audio/evaluate
// @desc    使用 DeepSeek 进行文本润色与智能评价
// @access  Private
router.post('/evaluate', auth, evaluateFeynmanAttempt);

module.exports = router;