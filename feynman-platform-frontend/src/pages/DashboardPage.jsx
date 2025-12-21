// src/pages/DashboardPage.jsx
import './DashboardPage.css';
import 'katex/dist/katex.min.css';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import apiClient from '../api/axios';
import MermaidRenderer from '../components/MermaidRenderer';
import ConfirmDialog from '../components/ConfirmDialog';

const decodeHtmlEntities = (str) => str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, '\'')
    .replace(/&#39;/g, '\'');

const MARKDOWN_HINTS = /(^|\n)\s{0,4}(#{1,6}\s|[-*+]\s|\d+\.\s|```|~~~|\|.*\||\$\$|graph\s+(?:td|tb|lr|rl)|flowchart|sequenceDiagram|stateDiagram|classDiagram|mindmap|mermaid)/i;
const MERMAID_KEYWORDS = /(graph\s+(?:tb|td|lr|rl)|flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram|gantt|journey|mindmap|quadrantChart|pie)\b/i;

const normalizeFullWidthChars = (text) => {
    if (typeof text !== 'string') return '';
    const map = {
        '（': '(',
        '）': ')',
        '，': ',',
        '。': '.',
        '；': ';',
        '：': ':',
        '？': '?',
        '！': '!',
        '【': '[',
        '】': ']',
        '｛': '{',
        '｝': '}',
        '“': '"',
        '”': '"',
        '‘': '\'',
        '’': '\'',
        '、': '/',
    };
    return text.replace(/[（），。；：？！【】｛｝“”‘’、]/g, (char) => map[char] || char);
};

const normalizeMermaidSyntax = (content) => {
    if (typeof content !== 'string') return '';
    return content.replace(/^\s*图\s*([Tt][Dd]|[Tt][Bb]|[Ll][Rr]|[Rr][Ll])\s*;?/gm, (_, dir) => `graph ${dir.toUpperCase()};`);
};

const containsEscapedMarkdown = (html) => {
    if (typeof html !== 'string') return false;
    const decoded = decodeHtmlEntities(html);
    const plain = decoded.replace(/<[^>]+>/g, '\n');
    return MARKDOWN_HINTS.test(plain);
};

const ensureMermaidFence = (content) => {
    if (typeof content !== 'string') return '';
    const normalized = normalizeMermaidSyntax(content);
    if (/```mermaid/.test(normalized)) return normalized;
    const match = normalized.match(MERMAID_KEYWORDS);
    if (!match) return normalized;

    const start = match.index ?? 0;
    const before = normalized.slice(0, start).trimEnd();
    const after = normalized.slice(start).trim();

    const mermaidBlock = after;

    let result = before;
    if (before) result += '\n\n';
    result += '```mermaid\n' + mermaidBlock + '\n```';
    return result;
};

const cleanHtmlToMarkdown = (html) => {
    if (typeof html !== 'string') return '';
    if (!containsEscapedMarkdown(html)) return html;

    let decoded = normalizeFullWidthChars(decodeHtmlEntities(html));
    decoded = decoded
        .replace(/<p[^>]*>/g, '\n')
        .replace(/<\/p>/g, '\n')
        .replace(/<br\s*\/?>(?=\n|\r|$)/g, '\n')
        .replace(/<br\s*\/?>(?!\n)/g, '\n')
        .replace(/<\/?(span|div)[^>]*>/g, '')
        .replace(/<\/?strong>/g, '**')
        .replace(/<\/?em>/g, '_')
        .replace(/<\/?u>/g, '')
        .replace(/<\/?code>/g, '`')
        .replace(/&nbsp;/g, ' ')
        .replace(/--&gt;/g, '-->')
        .replace(/\n{3,}/g, '\n\n');

    const result = decoded.trim();
    return ensureMermaidFence(result);
};

const isProbablyPureHtml = (str) => {
    if (typeof str !== 'string') return false;
    const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(str);
    if (!hasHtmlTags) return false;

    const hasMarkdownSyntax = /^#{1,6}\s|^\s*[-*+]\s|^\d+\.\s|```|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\|.*\||\$\$[^$]*?\$\$|\$[^$]+\$/m.test(str);
    const hasMermaidBlock = /```mermaid[\s\S]*?```/i.test(str);

    return !hasMarkdownSyntax && !hasMermaidBlock;
};

function DashboardPage() {
    const [knowledgePoints, setKnowledgePoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 批量模式与选中集合
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // 预览弹窗
    const [previewKp, setPreviewKp] = useState(null);
    const [previewClosing, setPreviewClosing] = useState(false);

    const openPreview = (kp) => {
        setPreviewKp(kp);
        setPreviewClosing(false);
    };

    const closePreview = () => {
        setPreviewClosing(true);
        setTimeout(() => {
            setPreviewKp(null);
            setPreviewClosing(false);
        }, 200);
    };

    // 删除确认弹窗状态
    const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
    const openConfirm = (message, onConfirm) => setConfirmState({ open: true, message, onConfirm });
    const closeConfirm = () => setConfirmState({ open: false, message: '', onConfirm: null });

    const navigate = useNavigate();

    const getId = (kp) => kp?.id ?? kp?._id;

    const getPreviewIndex = () => {
        if (!previewKp) return -1;
        const id = getId(previewKp);
        return knowledgePoints.findIndex((k) => getId(k) === id);
    };

    const hasPrev = () => {
        const idx = getPreviewIndex();
        return idx > 0;
    };

    const hasNext = () => {
        const idx = getPreviewIndex();
        return idx >= 0 && idx < knowledgePoints.length - 1;
    };

    const goPrev = () => {
        const idx = getPreviewIndex();
        if (idx > 0) setPreviewKp(knowledgePoints[idx - 1]);
    };

    const goNext = () => {
        const idx = getPreviewIndex();
        if (idx >= 0 && idx < knowledgePoints.length - 1) setPreviewKp(knowledgePoints[idx + 1]);
    };

    useEffect(() => {
        const fetchKnowledgePoints = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/knowledge-points');
                setKnowledgePoints(response.data);
            } catch (err) {
                console.error(err);
                setError('获取知识点失败');
            } finally {
                setLoading(false);
            }
        };

        fetchKnowledgePoints();
    }, []);

    useEffect(() => {
        if (!previewKp) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closePreview();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [previewKp, knowledgePoints]);

    const handleDelete = async (id, options = {}) => {
        const { fromModal = false } = options;

        try {
            await apiClient.delete(`/knowledge-points/${id}`);
            setKnowledgePoints((prev) => {
                const currentIndex = prev.findIndex((k) => getId(k) === id);
                const nextList = prev.filter((kp) => getId(kp) !== id);
                if (fromModal) {
                    if (nextList.length === 0) {
                        setPreviewKp(null);
                    } else {
                        const nextIndex = Math.min(currentIndex, nextList.length - 1);
                        setPreviewKp(nextList[nextIndex]);
                    }
                }
                return nextList;
            });
            return true;
        } catch (err) {
            console.error('删除失败', err);
            return false;
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        try {
            await Promise.allSettled(
                Array.from(selectedIds).map(id => apiClient.delete(`/knowledge-points/${id}`))
            );
            setKnowledgePoints(prev => prev.filter(kp => !selectedIds.has(getId(kp))));
            setSelectedIds(new Set());
            setBulkMode(false);
        } catch (err) {
            console.error('批量删除失败', err);
        }
    };

    const handleBulkQuiz = () => {
        if (selectedIds.size === 0) return;
        const idsParam = Array.from(selectedIds).join(',');
        navigate(`/quiz/batch?ids=${encodeURIComponent(idsParam)}`);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const markdownComponents = useMemo(() => ({
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');
            if (!inline && match?.[1] === 'mermaid') {
                return <MermaidRenderer code={codeContent} />;
            }

            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
    }), []);

    const renderContent = (kp) => {
        const raw = kp.content ?? '';
        const cleaned = cleanHtmlToMarkdown(raw);
        const shouldRenderAsHtml = isProbablyPureHtml(cleaned);

        if (import.meta.env.DEV) {
            console.debug('渲染知识点：', {
                id: getId(kp) ?? '无ID',
                title: kp?.title,
                preview: cleaned.slice(0, 80),
                detectedHtml: shouldRenderAsHtml,
            });
        }

        if (shouldRenderAsHtml) {
            return (
                <div
                    className="rich-text-html"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleaned) }}
                />
            );
        }

        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
            >
                {cleaned}
            </ReactMarkdown>
        );
    };

    if (loading) return <p className="loading-text">加载中...</p>;
    if (error) return <p className="error-text">{error}</p>;

    return (
        <div className="dashboard-page">
            <h1>我的知识点</h1>

            <div className="top-actions">
                <Link to="/kp/new">
                    <button className="new-kp-btn">+ 新建知识点</button>
                </Link>

                <button
                    className={`bulk-toggle-btn ${bulkMode ? 'active' : ''}`}
                    onClick={() => {
                        setBulkMode((v) => {
                            const next = !v;
                            if (!next) setSelectedIds(new Set());
                            return next;
                        });
                    }}
                >
                    {bulkMode ? '退出批量' : '批量处理'}
                </button>

                {bulkMode && (
                    <div className="bulk-actions">
                        <span className="bulk-selected-count">已选 {selectedIds.size} 项</span>
                        <button
                            className="bulk-action-btn danger"
                            disabled={selectedIds.size === 0}
                            onClick={() => openConfirm(`确定批量删除选中的 ${selectedIds.size} 个知识点吗？`, async () => { await handleBulkDelete(); closeConfirm(); })}
                        >
                            批量删除
                        </button>
                        <button
                            className="bulk-action-btn primary"
                            disabled={selectedIds.size === 0}
                            onClick={handleBulkQuiz}
                        >
                            批量出题
                        </button>
                    </div>
                )}
            </div>

            {knowledgePoints.length === 0 ? (
                <p className="empty-text">你还没有任何知识点，快去创建一个吧！</p>
            ) : (
                <div className="knowledge-points-grid">
                    {knowledgePoints.map((kp) => {
                        const id = getId(kp);
                        const selected = selectedIds.has(id);
                        return (
                            <div
                                key={id}
                                className={`knowledge-point-card ${selected ? 'selected' : ''}`}
                                onClick={() => {
                                    if (bulkMode) toggleSelect(id);
                                }}
                                onDoubleClick={() => {
                                    if (!bulkMode) openPreview(kp);
                                }}
                            >
                                {bulkMode && (
                                    <input
                                        type="checkbox"
                                        className="select-checkbox"
                                        checked={selected}
                                        onChange={() => toggleSelect(id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                                <h2>{kp.title}</h2>
                                <div className="knowledge-point-content markdown-content">
                                    {renderContent(kp)}
                                </div>
                                <div className={`knowledge-point-actions ${bulkMode ? 'disabled' : ''}`} onClick={(e) => { if (!bulkMode) e.stopPropagation(); }} onDoubleClick={(e) => e.stopPropagation()}>
                                    <Link to={`/kp/edit/${id}`} aria-disabled={bulkMode} tabIndex={bulkMode ? -1 : undefined} onClick={bulkMode ? (e) => e.preventDefault() : undefined}>
                                        <button className="edit-btn action-btn" disabled={bulkMode}>编辑</button>
                                    </Link>
                                    <Link to={`/feynman/${id}`} aria-disabled={bulkMode} tabIndex={bulkMode ? -1 : undefined} onClick={bulkMode ? (e) => e.preventDefault() : undefined}>
                                        <button className="feynman-btn action-btn" disabled={bulkMode}>开始复述</button>
                                    </Link>
                                    <Link to={`/quiz/${id}`} aria-disabled={bulkMode} tabIndex={bulkMode ? -1 : undefined} onClick={bulkMode ? (e) => e.preventDefault() : undefined}>
                                        <button className="edit-btn action-btn" disabled={bulkMode}>开始测评</button>
                                    </Link>
                                    <button
                                        className="delete-btn action-btn"
                                        disabled={bulkMode}
                                        onClick={() => openConfirm('你确定要删除这个知识点吗？', async () => { await handleDelete(id); closeConfirm(); })}
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {previewKp && (
                <div className={`modal-overlay ${!previewClosing ? 'modal-show' : ''}`} onClick={closePreview}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-side-btn prev" disabled={!hasPrev()} onClick={(e) => { e.stopPropagation(); goPrev(); }} title="上一条">‹</button>
                        <button className="modal-side-btn next" disabled={!hasNext()} onClick={(e) => { e.stopPropagation(); goNext(); }} title="下一条">›</button>
                        <button className="modal-side-btn prev" disabled={!hasPrev()} onClick={(e) => { e.stopPropagation(); goPrev(); }} title="上一条">‹</button>
                        <button className="modal-side-btn next" disabled={!hasNext()} onClick={(e) => { e.stopPropagation(); goNext(); }} title="下一条">›</button>
                        <div className="modal-header">
                            <h2 className="modal-title">{previewKp.title}</h2>
                            <button className="modal-close-btn" onClick={closePreview} title="关闭">×</button>
                        </div>
                        <div className="modal-body">
                            <div className="markdown-content">
                                {renderContent(previewKp)}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div className="modal-footer-actions">
                                <button className="edit-btn action-btn" onClick={() => navigate(`/kp/edit/${getId(previewKp)}`)}>编辑</button>
                                <button className="feynman-btn action-btn" onClick={() => navigate(`/feynman/${getId(previewKp)}`)}>开始复述</button>
                                <button className="edit-btn action-btn" onClick={() => navigate(`/quiz/${getId(previewKp)}`)}>开始测评</button>
                                <button className="delete-btn action-btn" onClick={() => openConfirm('你确定要删除这个知识点吗？', async () => { await handleDelete(getId(previewKp), { fromModal: true }); closeConfirm(); })}>删除</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDialog
                open={confirmState.open}
                title="删除确认"
                message={confirmState.message}
                confirmText="确认删除"
                cancelText="取消"
                onConfirm={confirmState.onConfirm}
                onCancel={closeConfirm}
            />
        </div>
    );
}

export default DashboardPage;
