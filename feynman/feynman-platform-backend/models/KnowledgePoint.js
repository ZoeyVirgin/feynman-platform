const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // 关联用户表

// 知识点模型
const KnowledgePoint = sequelize.define('KnowledgePoint', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: { // 外键关联User
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('not_started', 'in_progress', 'mastered'),
        defaultValue: 'not_started'
    },
    reviewList: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'knowledge_points',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// 建立关联
KnowledgePoint.belongsTo(User, { foreignKey: 'userId' });

module.exports = KnowledgePoint;
