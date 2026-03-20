// controllers/BaiduAiController.js
const { spawn } = require('child_process');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const AipSpeechClient = require('baidu-aip-sdk').speech;

// 从环境变量中获取凭证
const APP_ID = process.env.BAIDU_APP_ID;
const API_KEY = process.env.BAIDU_API_KEY;
const SECRET_KEY = process.env.BAIDU_SECRET_KEY;

// 新建一个 AipSpeechClient 对象
const client = new AipSpeechClient(APP_ID, API_KEY, SECRET_KEY);

// 使用 ffmpeg 将任意音频转为 16k 单声道 wav
async function convertToWav16k(buffer) {
    return new Promise((resolve, reject) => {
        // 使用 @ffmpeg-installer/ffmpeg 提供的二进制，避免依赖系统 PATH
        const ffmpeg = spawn(ffmpegInstaller.path, [
            '-y', // 覆盖输出（虽然我们只用内存）
            '-i', 'pipe:0', // 从 stdin 读入原始音频
            '-ac', '1', // 单声道
            '-ar', '16000', // 16k 采样率
            '-f', 'wav', // 输出 wav 格式
            'pipe:1', // 输出到 stdout
        ]);

        const chunks = [];

        ffmpeg.stdout.on('data', (data) => {
            chunks.push(data);
        });

        ffmpeg.stderr.on('data', (data) => {
            // 调试用日志，不直接返回给前端
            console.log('[ffmpeg]', data.toString());
        });

        ffmpeg.on('error', (err) => {
            reject(err);
        });

        ffmpeg.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`ffmpeg exited with code ${code}`));
            }
            resolve(Buffer.concat(chunks));
        });

        ffmpeg.stdin.write(buffer);
        ffmpeg.stdin.end();
    });
}

exports.transcribeAudio = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No audio file uploaded.' });
    }

    try {
        const { mimetype, originalname } = req.file;
        let audioBuffer = req.file.buffer;

        console.log('[audio] Received audio file:', {
            originalname,
            mimetype,
            size: audioBuffer.length,
        });

        // 如果不是 wav，或者不确定采样率/声道，一律先转一次 16k wav
        const needConvert = !/wav/i.test(mimetype || '') || true;

        if (needConvert) {
            console.log('[audio] Converting to 16k mono wav via ffmpeg ...');
            audioBuffer = await convertToWav16k(audioBuffer);
            console.log('[audio] Conversion done. New size:', audioBuffer.length);
        }

        // 调用语音识别短语音版
        // 'wav' 是文件格式, 16000 是采样率, dev_pid: 1537 是普通话模型
        const result = await client.recognize(audioBuffer, 'wav', 16000, {
            dev_pid: 1537,
        });

        console.log('Baidu ASR Result:', result);

        // 检查返回结果
        if (result.err_no === 0) {
            // 成功
            res.json({ result: result.result[0] });
        } else {
            // 失败
            res.status(500).json({ msg: 'Baidu ASR service error', error: result });
        }
    } catch (error) {
        console.error('Error in transcribeAudio:', error);
        res.status(500).send('Server error during transcription.');
    }
};

