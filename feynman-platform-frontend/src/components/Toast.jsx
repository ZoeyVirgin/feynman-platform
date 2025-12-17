import { useEffect, useState, useRef } from 'react';

// 轻量级全局 Toast 系统（事件驱动：window.dispatchEvent(new CustomEvent('notify', { detail: { type:'success'|'error'|'info'|'warn', message } })) ）
// 使用：在全局布局 Layout 中挂载 <Toast /> 一次即可

const THEME = {
  success: { bg: '#12b886', text: '#fff' },
  error: { bg: '#fa5252', text: '#fff' },
  info: { bg: '#228be6', text: '#fff' },
  warn: { bg: '#f59f00', text: '#212529' },
};

function Toast() {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      const { type = 'info', message = '' } = e.detail || {};
      const id = ++idRef.current;
      const theme = THEME[type] || THEME.info;
      const toast = { id, type, message, theme };
      setItems((prev) => [...prev, toast]);
      // 自动关闭
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, 3000);
    };
    window.addEventListener('notify', handler);
    return () => window.removeEventListener('notify', handler);
  }, []);

  const clear = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }} aria-live="polite" aria-relevant="additions removals">
      {items.map((it) => (
        <div
          key={it.id}
          role="status"
          onClick={() => clear(it.id)}
          style={{
            maxWidth: 420,
            background: it.theme.bg,
            color: it.theme.text,
            borderRadius: 8,
            boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
            padding: '10px 12px',
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          {it.message}
        </div>
      ))}
    </div>
  );
}

export default Toast;

