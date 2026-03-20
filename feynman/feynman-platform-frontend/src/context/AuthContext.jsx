import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('token'));  // 保存token
    const [user, setUser] = useState(() => {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null; // 保存用户信息
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            localStorage.removeItem('user'); // 清除损坏的数据
            return null;
        }
    });
    const [initializing, setInitializing] = useState(true);
    const refreshTimerRef = useRef(null);
    const silentRefreshRef = useRef(null);

    const clearRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    const parseJwtExp = (jwt) => {
        try {
            const payload = jwt.split('.')[1];
            const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
            return Number(json?.exp) || null;
        } catch (_) {
            return null;
        }
    };

    const scheduleProactiveRefresh = useCallback((tkn) => {
        clearRefreshTimer();
        const exp = parseJwtExp(tkn);
        if (!exp) return; // 无法解析则不预刷新
        const nowSec = Math.floor(Date.now() / 1000);
        // 提前60秒刷新
        let delayMs = (exp - 60 - nowSec) * 1000;
        if (delayMs <= 0) delayMs = 1000; // 立刻尝试刷新（1s后）
        refreshTimerRef.current = setTimeout(async () => {
            try {
                const fn = silentRefreshRef.current;
                if (typeof fn === 'function') {
                    const ok = await fn();
                    if (!ok) {
                        // 刷新失败，交由 axios 拦截器/ProtectedRoute 处理
                        return;
                    }
                    // 刷新成功后，会通过 login 设置新 token，再次安排定时器
                    //（无需在此处再次调用 schedule）
                }
            } catch (_) {}
        }, delayMs);
    }, [clearRefreshTimer]);

    const login = useCallback((newToken, userData) => {
        if (newToken) {
            setToken(newToken);
            localStorage.setItem('token', newToken);
            try { scheduleProactiveRefresh(newToken); } catch (_) {}
        }
        if (userData) {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        }
    }, [scheduleProactiveRefresh]);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        try { window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: '会话已结束' } })); } catch (_) {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        try { clearRefreshTimer(); } catch (_) {}
    }, [clearRefreshTimer]);

    // 静默刷新：尝试用 httpOnly 刷新令牌换新 access token
    const silentRefresh = useCallback(async () => {
        try {
            const hadToken = !!localStorage.getItem('token');
            const res = await apiClient.post('/users/refresh', {});
            const newToken = res?.data?.token;
            const newUser = res?.data?.user;
            if (newToken) {
                login(newToken, newUser);
                // 仅在存在旧 token（续期）或首次通过 cookie 自动登录时给出提示
                try {
                    if (hadToken) {
                        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: '登录状态已自动续期' } }));
                    } else {
                        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: '已通过安全凭证自动登录' } }));
                    }
                } catch (_) {}
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [login]);

    // 同步最新的 silentRefresh 到 ref，避免闭包/初始化顺序问题
    useEffect(() => {
        silentRefreshRef.current = silentRefresh;
    }, [silentRefresh]);

    // 验证当前 token
    const verifyToken = useCallback(async () => {
        try {
            const response = await apiClient.get('/users/verify');
            setUser(response.data.user);
            return true;
        } catch (error) {
            // token无效：先尝试静默刷新
            const refreshed = await silentRefresh();
            if (refreshed) return true;
            logout();
            return false;
        }
    }, [logout, silentRefresh]);

    // 初始化：如果有 token 走校验；如果没有，也尝试刷新（因为 cookie 里可能还在）
    useEffect(() => {
        (async () => {
            if (token) {
                const ok = await verifyToken();
                if (ok) {
                    try { scheduleProactiveRefresh(localStorage.getItem('token') || token); } catch (_) {}
                }
            } else {
                const ok = await silentRefresh();
                if (ok) {
                    try { scheduleProactiveRefresh(localStorage.getItem('token')); } catch (_) {}
                }
            }
            setInitializing(false);
        })();
        // 监听全局刷新事件（来自 axios 响应拦截器）
        const onToken = (e) => login(e.detail?.token, e.detail?.user);
        const onLogout = () => logout();
        window.addEventListener('auth:token', onToken);
        window.addEventListener('auth:logout', onLogout);
        return () => {
            window.removeEventListener('auth:token', onToken);
            window.removeEventListener('auth:logout', onLogout);
            try { clearRefreshTimer(); } catch (_) {}
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = { token, user, login, logout, verifyToken, silentRefresh, initializing };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 自定义 Hook，方便使用
export function useAuth() {
    return useContext(AuthContext);
}
