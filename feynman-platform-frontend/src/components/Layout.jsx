import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

function Layout() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:4500/api/users/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (_) {}
    logout();
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: '已退出登录' } }));
    navigate('/login');
  };

  const isAuthPage = /^(\/login|\/register)\b/.test(location.pathname);
  const is3DWorld = location.pathname === '/3d-world';

  return (
    <div className={`app-layout ${is3DWorld ? 'layout-3d-world' : ''}`}>
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
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
