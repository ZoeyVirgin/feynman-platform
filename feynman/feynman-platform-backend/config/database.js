const { Sequelize } = require('sequelize');//Node.js 项目里用 Sequelize 连接 MySQL 数据库。
require('dotenv').config();

const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    logging: false, // 关闭SQL日志输出
});

module.exports = sequelize;