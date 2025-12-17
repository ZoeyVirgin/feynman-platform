import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 引入useAuth
import Toast from './Toast';

function Layout() {
  const { token, user, logout } = useAuth(); // 拿到token、user和logout函数
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      // 通知后端清除 httpOnly 刷新cookie
      await fetch('http://localhost:4500/api/users/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (_) {}
    logout();        // 清除token和用户信息
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: '已退出登录' } }));
    navigate('/login'); // 跳回登录页
  };

  const isAuthPage = /^(\/login|\/register)\b/.test(location.pathname);

  return (
    <div className="app-layout">
      {/* 全局通知 */}
      <Toast />
      {!isAuthPage && (
        <nav className="top-nav">
          <div className="nav-left">
            <Link to="/" className="nav-link">主页</Link>
            {token && (
              <>
                <Link to="/agent" className="nav-link">AI助手</Link>
                <Link to="/graph" className="nav-link">知识图谱</Link>
                <Link to="/3d-world" className="nav-link">3D视界</Link>
              </>
            )}
            {token && user && (
              <span className="nav-username">欢迎，{user.username}！</span>
            )}
          </div>

          <div className="nav-right">
            {!token && (
              <>
                <Link to="/login" className="nav-link">登录</Link>
                <Link to="/register" className="nav-link">注册</Link>
              </>
            )}

            {token && (
              <button onClick={handleLogout} className="nav-logout">退出登录</button>
            )}
          </div>
        </nav>
      )}

      <main style={{ padding: isAuthPage ? '0' : '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
