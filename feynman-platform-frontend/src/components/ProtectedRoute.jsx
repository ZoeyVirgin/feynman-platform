// src/components/ProtectedRoute.jsx
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

function ProtectedRoute() {
  const { token, initializing, silentRefresh } = useAuth();
  const location = useLocation(); // 保存当前路径，用于可能的返回
  const [checking, setChecking] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (token) return; // 已登录
      setChecking(true);
      try {
        // 没有 token 时，先尝试静默刷新
        const ok = await silentRefresh();
        if (!cancelled) setNeedLogin(!ok);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    if (!token && !initializing) check();
    return () => { cancelled = true; };
  }, [token, initializing, silentRefresh]);

  if (initializing || checking) {
    return <div style={{ padding: 24, color: '#868e96' }}>加载中...</div>;
  }

  if (!token && needLogin) {
    // 友好提示
    try { window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warn', message: '登录状态已过期，请重新登录' } })); } catch (_) {}
    return <Navigate to="/login" replace state={{ from: location, message: '登录状态已悄悄过期，请重新登录' }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
