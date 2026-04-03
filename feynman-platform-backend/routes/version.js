const express = require('express');
const router = express.Router();

const LATEST_VERSION = '1.1.0';
const LATEST_VERSION_CODE = 2;
const DOWNLOAD_URL = 'http://172.29.216.68:5173/download';

router.get('/check', (req, res) => {
  res.json({
    version: LATEST_VERSION,
    versionCode: LATEST_VERSION_CODE,
    downloadUrl: DOWNLOAD_URL,
    releaseNotes: '1. 新增应用更新检查功能\n2. 优化WebView性能\n3. 修复已知问题',
    forceUpdate: false
  });
});

router.get('/download', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>应用下载</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 50px; text-align: center; }
        .download-box { border: 2px solid #2196F3; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
        .version { font-size: 24px; color: #2196F3; font-weight: bold; }
        .btn { background: #2196F3; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="download-box">
        <h1>费曼学习平台</h1>
        <p class="version">最新版本: ${LATEST_VERSION}</p>
        <p>更新内容:</p>
        <pre style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 5px;">
1. 新增应用更新检查功能
2. 优化WebView性能
3. 修复已知问题
        </pre>
        <a href="/download/app.hap" class="btn">下载安装包</a>
      </div>
    </body>
    </html>
  `);
});

module.exports = router;
