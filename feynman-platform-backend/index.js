const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
console.log('JWT_SECRET =', process.env.JWT_SECRET);

// 导入数据库配置和模型
const sequelize = require('./config/database');
const User = require('./models/User');
const Conversation = require('./models/Conversation'); // 导入 Conversation 模型
const { rebuildAllVectors, getRetriever } = require('./services/vectorStoreService');

const app = express();
const port = process.env.PORT || 4500;

// 中间件
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

// 数据库连接与同步
sequelize.authenticate()
    .then(() => {
        console.log('数据库连接成功');
        return sequelize.sync(); // 同步所有定义的模型
    })
    .then(async () => {
        console.log('数据库表已同步');
        // ... RAG 重建逻辑保持不变 ...
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

// API 路由
app.use('/api/users', require('./routes/users'));
app.use('/api/knowledge-points', require('./routes/knowledgePoints'));
app.use('/api/audio', require('./routes/audio'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/graph', require('./routes/graph'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/version', require('./routes/version'));

app.get('/', (req, res) => {
    res.send("欢迎来到新世界！")
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});