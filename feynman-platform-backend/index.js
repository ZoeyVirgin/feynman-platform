const express = require('express');//引入express工具包
const cors = require('cors');//引入cors允许跨域请求
const bcrypt = require('bcryptjs');//加密密码
const cookieParser = require('cookie-parser');
const fs = require('fs');
require('dotenv').config();//读取文件环境配置
console.log('JWT_SECRET =', process.env.JWT_SECRET);

//导入数据库配置和模型
const sequelize = require('./config/database');
const User = require('./models/User');
const { rebuildAllVectors, getRetriever, VECTOR_STORE_PATH } = require('./services/vectorStoreService');

//创建express实例，定义服务器端口号，优先环境变量中的端口号否则4500
const app = express();
const port = process.env.PORT || 4500;

//中间件，允许跨域和解析json数据
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: isDev ? true : function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS: ' + origin));
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

//数据库连接
sequelize.authenticate()
    .then(() => {
        console.log('数据库连接成功');
        // 同步数据库表（开发环境）
        // return sequelize.sync({ alter: true });
        return sequelize.sync();

    })
    .then(async () => {
        console.log('数据库表已同步');
        try {
            const force = String(process.env.RAG_FORCE_REBUILD_ON_START || '').toLowerCase();
            const auto = String(process.env.RAG_AUTO_REBUILD_ON_START || 'true').toLowerCase();
            const isTrue = (v) => v === 'true' || v === '1' || v === 'yes';
            if (isTrue(force)) {
                console.log('[RAG] 启动时强制重建向量库...');
                const r = await rebuildAllVectors();
                console.log('[RAG] 启动重建完成:', r);
            } else if (isTrue(auto)) {
                try {
                    await getRetriever(1);
                    console.log('[RAG] 启动检查：向量检索可用，跳过自动重建');
                } catch (e) {
                    console.log('[RAG] 启动检查：检索不可用，自动重建中...', e?.message || e);
                    const r = await rebuildAllVectors();
                    console.log('[RAG] 自动重建完成:', r);
                }
            }
        } catch (e) {
            console.warn('[RAG] 启动重建流程异常：', e?.message || e);
        }
    })
    .catch(err => {
        console.error('数据库连接错误:', err);
    });

//api路由
app.use('/api/users', require('./routes/users'));
app.use('/api/knowledge-points', require('./routes/knowledgePoints'));
app.use('/api/audio', require('./routes/audio'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/graph', require('./routes/graph'));

//访问 http://localhost:4500/ 触发
app.get('/', (req, res) => {
    res.send("欢迎来到新世界！")
});

//监听服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});