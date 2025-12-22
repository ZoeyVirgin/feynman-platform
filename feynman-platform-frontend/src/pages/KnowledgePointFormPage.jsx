// src/pages/KnowledgePointFormPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // 默认主题

function KnowledgePointFormPage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); // HTML 内容
    const [submitting, setSubmitting] = useState(false);
    const { id } = useParams(); // 编辑模式获取ID
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    useEffect(() => {
        if (isEditing) {
            // 获取已有知识点数据
            const fetchKp = async () => {
                try {
                    const res = await apiClient.get(`/knowledge-points/${id}`);
                    setTitle(res.data.title);
                    setContent(res.data.content);
                } catch (err) {
                    console.error('获取知识点失败', err);
                }
            };
            fetchKp();
        }
    }, [id, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const kpData = { title, content };

        const promise = isEditing
            ? apiClient.put(`/knowledge-points/${id}`, kpData)
            : apiClient.post('/knowledge-points', kpData);

        promise
            .then(() => {
            navigate('/'); // 提交成功返回 Dashboard
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <div style={{ width: '100%' }}>
            {/* 居中容器，保持与原表单同样的居中效果与宽度 */}
            <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
                {/* 标题，仅展示，不再放返回按钮 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <h1 style={{ margin: 0 }}>{isEditing ? '编辑知识点' : '新建知识点'}</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>标题:</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                            required
                        />
                    </div>
                    <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                        <label>内容:</label>
                        <div>
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                style={{ height: '300px', width: '100%' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: '1rem', alignItems: 'center' }}>
                        <button type="submit" disabled={submitting}>
                            {submitting ? '保存中...' : (isEditing ? '更新' : '创建')}
                        </button>
                        <button type="button" className="back-btn" onClick={() => navigate(-1)} disabled={submitting}>返回</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default KnowledgePointFormPage;
