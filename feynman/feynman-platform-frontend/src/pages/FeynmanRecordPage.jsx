// src/pages/FeynmanRecordPage.jsx
import { useReactMediaRecorder } from 'react-media-recorder';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import './FeynmanRecordPage.css'; // 引入新的样式文件

function FeynmanRecordPage() {
    const { id } = useParams(); // 知识点ID
    const [kpTitle, setKpTitle] = useState('');
    const [transcribedText, setTranscribedText] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // 新增：AI 评价相关状态
    const [aiFeedback, setAiFeedback] = useState(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    // 使用 hook（保留，但不使用）
    const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });

    // 获取返回的功能
    const navigate = useNavigate(); // 用于导航

    useEffect(() => {
        // 获取知识点标题用于显示
        const fetchKpTitle = async () => {
            const response = await apiClient.get(`/knowledge-points/${id}`);
            setKpTitle(response.data.title);
        };
        fetchKpTitle();
    }, [id]);

    const handleStopRecording = async () => {
        stopRecording(); // 这个库的stopRecording是异步的，但我们可以在onStop回调中处理
    };

    // 新增：调用后端进行 AI 润色与评价
    const getAiEvaluation = async (transcribed) => {
        setIsEvaluating(true);
        setAiFeedback(null);
        try {
            // 获取原始知识点内容
            const kpResponse = await apiClient.get(`/knowledge-points/${id}`);
            const originalContent = kpResponse.data.content;

            const feedbackResponse = await apiClient.post('/audio/evaluate', {
                originalContent,
                transcribedText: transcribed,
            });
            setAiFeedback(feedbackResponse.data);
        } catch (error) {
            console.error('获取AI评价失败', error);
        } finally {
            setIsEvaluating(false);
        }
    };

    const uploadAudio = async (blobUrl) => {
        setIsUploading(true);
        setTranscribedText('');
        try {
            const audioBlob = await fetch(blobUrl).then(r => r.blob());
            const audioFile = new File([audioBlob], `feynman-record-${id}.wav`, { type: 'audio/wav' });

            const formData = new FormData();
            formData.append('audio', audioFile); // 'audio'要和后端multer的字段名一致
            formData.append('knowledgePointId', id); // 顺便把知识点ID也传过去

            const response = await apiClient.post('/audio/transcribe', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response?.data?.result) {
                setTranscribedText(response.data.result);
                // 成功后触发 AI 评价
                getAiEvaluation(response.data.result);
            } else {
                setTranscribedText('转录失败，请重试。');
            }
        } catch (error) {
            console.error('上传或转录失败', error);
            setTranscribedText('转录失败，请重试。');
        } finally {
            setIsUploading(false);
        }
    };

    // 改造 useReactMediaRecorder，使其在停止时自动上传
    const { status: recStatus, startRecording: recStart, stopRecording: recStop, mediaBlobUrl: recUrl } = useReactMediaRecorder({
        audio: true,
        onStop: (blobUrl, blob) => {
            uploadAudio(blobUrl);
        }
    });

    return (
        <div className="feynman-record-page">
            <h1>复述知识点: {kpTitle}</h1>

            {/* 按钮区域（统一把返回按钮放到主要操作旁边） */}
            <div className="action-buttons" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <button onClick={recStart} disabled={recStatus === 'recording'} className="record-btn">
                    开始录音
                </button>
                <button onClick={recStop} disabled={recStatus !== 'recording'} className="record-btn">
                    停止录音
                </button>
                <button onClick={() => navigate(-1)} className="back-btn">
                    返回
                </button>
            </div>

            <hr />

            {/* 录音状态 */}
            <p className="rec-status">录音状态: {recStatus}</p>

            {recUrl && <audio src={recUrl} controls />}

            <hr />

            <h2>AI 转录结果:</h2>
            {isUploading && <p className="uploading-text">正在上传并转录，请稍候...</p>}
            <div className="transcription-container">
                {transcribedText}
            </div>

            <hr />

            <h2>AI 教练反馈:</h2>
            {isEvaluating && <p>AI教练正在批阅您的答卷...</p>}
            {aiFeedback && (
                <div className="ai-feedback" style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <h3>AI 润色后的文本</h3>
                        <p style={{ background: '#eef', padding: '1rem' }}>{aiFeedback.polishedText}</p>

                        <h3>综合评价</h3>
                        <p>{aiFeedback.evaluation}</p>

                        <h3>优点 👍</h3>
                        <ul>
                            {aiFeedback.strengths?.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>

                        <h3>待改进 👇</h3>
                        <ul>
                            {aiFeedback.weaknesses?.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </div>
                    <div style={{ flex: '0 0 150px', textAlign: 'center' }}>
                        <h3>综合得分</h3>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: (aiFeedback.score || 0) > 80 ? 'green' : 'orange' }}>
                            {aiFeedback.score}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FeynmanRecordPage;
