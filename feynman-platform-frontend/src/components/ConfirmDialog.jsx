import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

function ConfirmDialog({ open, title = '确认操作', message = '', confirmText = '确认删除', cancelText = '取消', onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  const node = (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <h3 id="confirm-title" className="confirm-title">{title}</h3>
          <button className="confirm-close" onClick={onCancel} aria-label="关闭">×</button>
        </div>
        <div className="confirm-body">
          <p className="confirm-message">{message}</p>
        </div>
        <div className="confirm-footer">
          <button className="confirm-btn cancel" onClick={onCancel}>{cancelText}</button>
          <button className="confirm-btn danger" onClick={onConfirm} autoFocus>{confirmText}</button>
        </div>
      </div>
    </div>
  );

  // 使用 portal 挂载到 body，避免被上层 transform 影响覆盖范围
  return createPortal(node, document.body);
}

export default ConfirmDialog;

