const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // 引入加密库
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// 令牌配置
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const signAccessToken = (userId) => jwt.sign({ user: { id: userId } }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
const signRefreshToken = (userId) => jwt.sign({ user: { id: userId } }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

const setRefreshCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        sameSite: 'lax', // 便于前端在跨站(同端口不同端口)携带
        secure: false,   // 开发环境 false；生产 HTTPS 应为 true
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/api/users',
    });
};

const clearRefreshCookie = (res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/api/users',
    });
};

// --- 用户注册 API (已集成密码加密) ---
// @route   POST /api/users/register
// @desc    注册一个新用户
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ msg: '用户已存在' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ username, email, password: hashedPassword });

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);
        setRefreshCookie(res, refreshToken);

        res.json({
            token: accessToken,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('服务器错误');
    }
});

// --- 用户登录 API ---
// @route   POST /api/users/login
// @desc    用户登录并获取token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ msg: '账号不存在' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: '密码错误' });

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);
        setRefreshCookie(res, refreshToken);

        res.json({
            token: accessToken,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('服务器错误');
    }
});

// --- 刷新 Access Token ---
// @route   POST /api/users/refresh
// @desc    使用 httpOnly 刷新令牌换新访问令牌
// @access  Public (基于 cookie 验证)
router.post('/refresh', async (req, res) => {
    try {
        const token = req.cookies && req.cookies.refreshToken;
        if (!token) return res.status(401).json({ msg: '缺少刷新令牌' });
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        const userId = decoded?.user?.id;
        const user = await User.findByPk(userId, { attributes: ['id', 'username', 'email'] });
        if (!user) return res.status(401).json({ msg: '用户不存在' });

        // 可选：刷新时也可以轮换 refreshToken，这里简单返回新的 accessToken
        const newAccess = signAccessToken(user.id);
        res.json({
            token: newAccess,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (err) {
        console.error('refresh error:', err.message);
        return res.status(401).json({ msg: '刷新令牌无效或过期' });
    }
});

// --- 退出登录，清除刷新令牌 ---
// @route   POST /api/users/logout
router.post('/logout', (req, res) => {
    clearRefreshCookie(res);
    res.json({ ok: true });
});

// --- 验证 Token API ---
// @route   GET /api/users/verify
// @desc    验证 Token 是否有效
// @access  Private
router.get('/verify', auth, async (req, res) => {
    try {
        res.json({
            valid: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email
            }
        });
    } catch (err) {
        res.status(401).json({ msg: 'Token已过期' });
    }
});

module.exports = router;