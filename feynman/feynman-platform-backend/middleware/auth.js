const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        // 尝试获取token
        let token = req.header('x-auth-token');
        const authHeader = req.header('authorization') || req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // 没有token
        if (!token) {
            return res.status(401).json({ msg: '缺少访问令牌' });
        }
        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded && decoded.user && decoded.user.id;
        if (!userId) {
            return res.status(401).json({ msg: '令牌无效' });
        }
        // 获取用户信息并附加到请求对象上，排除密码字段
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'created_at', 'updated_at',]
        });
        // 用户不存在
        if (!user) {
            return res.status(401).json({ msg: '用户不存在' });
        }
        // 继续下一个中间件或路由处理程序
        req.user = user;
        next();
    } catch (err) {
        console.error('auth middleware error:', err.message);
        if (err && err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token已过期' });
        }
        return res.status(401).json({ msg: '令牌无效' });
    }
}