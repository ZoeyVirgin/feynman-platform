import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

function Layout() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', {
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
  // 将 3D 视界和知识图谱页面都视为"沉浸式"页面
  const isImmersivePage = location.pathname === '/3d-world' || location.pathname === '/graph';
  const isAgentPage = location.pathname === '/agent';

  // 定义需要居中的页面路径
  const centeredPaths = [
    '/login',
    '/register',
    '/kp/new',
    '/kp/edit/',
    '/feynman/',
    '/quiz/',
  ];

  const isCenteredPage = centeredPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className={`app-layout ${isImmersivePage ? 'layout-immersive' : ''} ${isAgentPage ? 'layout-fullscreen' : ''}`}>
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
      <main className={isCenteredPage ? 'main-centered' : ''}>
        <div className="route-fade" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
