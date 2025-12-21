import { useState, useRef, useEffect } from 'react';
import apiClient from '../api/axios';
import './AgentPage.css';

function AgentPage() {
  // 对话列表：[{ id, title, messages: [...] }, ...]
  const [conversations, setConversations] = useState([
    {
      id: Date.now(),
      title: '新对话',
      messages: [{ sender: 'bot', text: '你好！我是你的专属知识库AI助手。有什么可以帮你的吗？' }],
    },
  ]);
  const [currentConvId, setCurrentConvId] = useState(conversations[0].id);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 向量库状态
  const [vsStatus, setVsStatus] = useState(null);
  const [vsLoading, setVsLoading] = useState(false);
  const [vsRebuilding, setVsRebuilding] = useState(false);

  const messagesEndRef = useRef(null);

  const currentConv = conversations.find((c) => c.id === currentConvId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages]);

  const fetchVectorStoreStatus = async () => {
    setVsLoading(true);
    try {
      const res = await apiClient.get('/ai/vector-store/status');
      setVsStatus(res.data);
    } catch (err) {
      try {
        const raw = await fetch('/api/ai/vector-store/status', { credentials: 'include' });
        const data = await raw.json();
        setVsStatus(data);
      } catch (e2) {
        setVsStatus({ error: err?.response?.data || err?.message || 'unknown error' });
      }
    } finally {
      setVsLoading(false);
    }
  };

  const rebuildVectorStore = async () => {
    if (vsRebuilding) return;
    setVsRebuilding(true);
    try {
      const res = await apiClient.post('/ai/vector-store/rebuild', {});
      await fetchVectorStoreStatus();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConvId
            ? { ...c, messages: [...c.messages, { sender: 'bot', text: `知识库已重建：共处理 ${res?.data?.rebuilt ?? 0} 条。` }] }
            : c
        )
      );
    } catch (err) {
      try {
        const raw = await fetch('/api/ai/vector-store/rebuild-dev');
        const data = await raw.json();
        await fetchVectorStoreStatus();
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConvId
              ? { ...c, messages: [...c.messages, { sender: 'bot', text: `知识库已重建：共处理 ${data?.rebuilt ?? 0} 条。` }] }
              : c
          )
        );
      } catch (e2) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConvId
              ? { ...c, messages: [...c.messages, { sender: 'bot', text: `重建失败：${err?.response?.data?.msg || err?.message || 'unknown error'}` }] }
              : c
          )
        );
      }
    } finally {
      setVsRebuilding(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const question = inputValue;
    const userMessage = { sender: 'user', text: question };

    setConversations((prev) =>
      prev.map((c) => (c.id === currentConvId ? { ...c, messages: [...c.messages, userMessage] } : c))
    );

    // 自动更新对话标题（取首条用户消息前20字）
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentConvId && c.title === '新对话') {
          return { ...c, title: question.slice(0, 20) + (question.length > 20 ? '...' : '') };
        }
        return c;
      })
    );

    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/ai/rag-qa', { question, returnSources: true });
      const text = response?.data?.answer || '（无返回内容）';
      const sources = Array.isArray(response?.data?.sources) ? response.data.sources : [];
      const botMessage = { sender: 'bot', text, sources };
      setConversations((prev) =>
        prev.map((c) => (c.id === currentConvId ? { ...c, messages: [...c.messages, botMessage] } : c))
      );
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = { sender: 'bot', text: '抱歉，我遇到了一些问题，请稍后再试。' };
      setConversations((prev) =>
        prev.map((c) => (c.id === currentConvId ? { ...c, messages: [...c.messages, errorMessage] } : c))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = () => {
    const newConv = {
      id: Date.now(),
      title: '新对话',
      messages: [{ sender: 'bot', text: '你好！我是你的专属知识库AI助手。有什么可以帮你的吗？' }],
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentConvId(newConv.id);
  };

  const deleteConversation = (id) => {
    if (conversations.length === 1) {
      // 至少保留一个对话
      return;
    }
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (currentConvId === id) {
        setCurrentConvId(next[0]?.id || Date.now());
      }
      return next;
    });
  };

  return (
    <div className="agent-page-container">
      {/* 左侧对话列表 */}
      <aside className="conversation-sidebar">
        <div className="sidebar-header">
          <button className="new-conv-btn" onClick={createNewConversation}>
            + 新建对话
          </button>
        </div>
        <div className="conversation-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === currentConvId ? 'active' : ''}`}
              onClick={() => setCurrentConvId(conv.id)}
            >
              <div className="conv-title">{conv.title}</div>
              {conversations.length > 1 && (
                <button
                  className="conv-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  title="删除对话"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* 右侧对话区域 */}
      <div className="agent-page">
        {/* 工具栏 */}
        <div className="agent-tools">
          <button className="tool-btn" onClick={fetchVectorStoreStatus} disabled={vsLoading}>
            {vsLoading ? '检查中…' : '检查状态'}
          </button>
          <button className="tool-btn" onClick={rebuildVectorStore} disabled={vsRebuilding}>
            {vsRebuilding ? '重建中…' : '刷新知识库'}
          </button>
          {vsStatus && (
            <div className="status-line">
              <span>目录: {vsStatus.dir || '-'}</span>
              <span> | 可用: {String(vsStatus.retrieverReady || false)}</span>
              {Array.isArray(vsStatus.files) && <span> | 文件数: {vsStatus.files.length}</span>}
              {vsStatus.error && <span className="warn"> | 错误: {String(vsStatus.error)}</span>}
            </div>
          )}
        </div>

        <div className="chat-window">
          {currentConv.messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-bubble">
                {msg.text}
                {msg.sender === 'bot' && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <div className="sources">
                    <div className="sources-title">参考片段：</div>
                    {msg.sources.map((s, i) => (
                      <div key={i} className="source-item">
                        <div className="source-index">片段 {s.index || i + 1}</div>
                        <div className="source-content">
                          {(s.content || '').slice(0, 240)}
                          {(s.content || '').length > 240 ? '…' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="message-bubble typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="在这里输入你的问题..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? '思考中...' : '发送'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AgentPage;
