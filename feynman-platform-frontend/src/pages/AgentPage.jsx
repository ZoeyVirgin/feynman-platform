import { useState, useRef, useEffect } from 'react';
import apiClient from '../api/axios';
import './AgentPage.css';

function AgentPage() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '你好！我是你的专属知识库AI助手。有什么可以帮你的吗？' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 向量库状态
  const [vsStatus, setVsStatus] = useState(null);
  const [vsLoading, setVsLoading] = useState(false);
  const [vsRebuilding, setVsRebuilding] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchVectorStoreStatus = async () => {
    setVsLoading(true);
    try {
      // 优先请求鉴权接口
      const res = await apiClient.get('/ai/vector-store/status');
      setVsStatus(res.data);
    } catch (err) {
      // 开发环境可回退到 dev 调试口
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
      // 尝试鉴权接口
      const res = await apiClient.post('/ai/vector-store/rebuild', {});
      // 重建完成后刷新状态
      await fetchVectorStoreStatus();
      // 提示消息气泡
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `知识库已重建：共处理 ${res?.data?.rebuilt ?? 0} 条。` },
      ]);
    } catch (err) {
      // 开发环境回退到 dev 路由
      try {
        const raw = await fetch('/api/ai/vector-store/rebuild-dev');
        const data = await raw.json();
        await fetchVectorStoreStatus();
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: `知识库已重建：共处理 ${data?.rebuilt ?? 0} 条。` },
        ]);
      } catch (e2) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: `重建失败：${err?.response?.data?.msg || err?.message || 'unknown error'}` },
        ]);
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
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/ai/rag-qa', { question, returnSources: true });
      const text = response?.data?.answer || '（无返回内容）';
      const sources = Array.isArray(response?.data?.sources) ? response.data.sources : [];
      const botMessage = { sender: 'bot', text, sources };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = { sender: 'bot', text: '抱歉，我遇到了一些问题，请稍后再试。' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-bubble">
              {msg.text}
              {msg.sender === 'bot' && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                <div className="sources">
                  <div className="sources-title">参考片段：</div>
                  {msg.sources.map((s, i) => (
                    <div key={i} className="source-item">
                      <div className="source-index">片段 {s.index || i + 1}</div>
                      <div className="source-content">{(s.content || '').slice(0, 240)}{(s.content || '').length > 240 ? '…' : ''}</div>
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
  );
}

export default AgentPage;
