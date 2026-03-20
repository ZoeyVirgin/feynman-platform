const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const KnowledgePoint = require('../models/KnowledgePoint');
const { addKnowledgePointToStore } = require('../services/vectorStoreService');

// POST /api/knowledge-points - 创建
router.post('/', auth, async (req, res) => {
    try {
        const { title, content } = req.body;
        const kp = await KnowledgePoint.create({
            title,
            content,
            userId: req.user.id
        });
        // 异步加入向量库（不阻塞主请求）
        try { addKnowledgePointToStore(kp); } catch (_) {}
        res.json(kp);
    } catch (err) {
        console.error(err);
        res.status(500).send('服务器错误');
    }
});

// GET /api/knowledge-points - 获取当前用户所有知识点
router.get('/', auth, async (req, res) => {
    try {
        const kps = await KnowledgePoint.findAll({
            where: { userId: req.user.id },
            order: [['created_at', 'DESC']]
        });
        res.json(kps);
    } catch (err) {
        console.error(err);
        res.status(500).send('服务器错误');
    }
});

// GET /api/knowledge-points/:id - 获取单个知识点
router.get('/:id', auth, async (req, res) => {
    try {
        const kp = await KnowledgePoint.findByPk(req.params.id);
        if (!kp) return res.status(404).json({ msg: '知识点未找到' });
        if (kp.userId !== req.user.id) return res.status(401).json({ msg: '未授权' });
        res.json(kp);
    } catch (err) {
        console.error(err);
        res.status(500).send('服务器错误');
    }
});

// PUT /api/knowledge-points/:id - 更新
router.put('/:id', auth, async (req, res) => {
    try {
        const kp = await KnowledgePoint.findByPk(req.params.id);
        if (!kp) return res.status(404).json({ msg: '知识点未找到' });
        if (kp.userId !== req.user.id) return res.status(401).json({ msg: '未授权' });

        const { title, content, status, reviewList } = req.body;
        const updateData = {};
        if (typeof title !== 'undefined') updateData.title = title;
        if (typeof content !== 'undefined') updateData.content = content;
        if (typeof status !== 'undefined') updateData.status = status;
        if (typeof reviewList !== 'undefined') updateData.reviewList = reviewList;

        const prevContent = kp.content;
        await kp.update(updateData);
        try {
            if (Object.prototype.hasOwnProperty.call(updateData, 'content') && updateData.content !== prevContent) {
                require('../services/vectorStoreService').addKnowledgePointToStore(kp);
            }
        } catch (_) {}
        res.json(kp);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/knowledge-points/:id - 删除
router.delete('/:id', auth, async (req, res) => {
    try {
        const kp = await KnowledgePoint.findByPk(req.params.id);
        if (!kp) return res.status(404).json({ msg: '知识点未找到' });
        if (kp.userId !== req.user.id) return res.status(401).json({ msg: '未授权' });

        await kp.destroy();
        res.json({ msg: '知识点已删除' });
    } catch (err) {
        console.error(err);
        res.status(500).send('服务器错误');
    }
});

module.exports = router;
