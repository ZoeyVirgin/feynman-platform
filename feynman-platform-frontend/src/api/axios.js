// src/api/axios.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// --- 刷新队列，避免并发重复刷新 ---
let isRefreshing = false;
let refreshPromise = null;
const pendingQueue = [];

function subscribeTokenRefresh(cb) {
    pendingQueue.push(cb);
}
function onRefreshed(newToken) {
    while (pendingQueue.length) {
        const cb = pendingQueue.shift();
        try { cb(newToken); } catch (_) {}
    }
}

// 添加请求拦截器，每次请求都会自动带上token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 新增：设置响应拦截器的函数
export const setupResponseInterceptor = (showToast, logout) => {
    const interceptorId = apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { response, config } = error || {};
            if (!response) {
                showToast('网络错误，请检查您的连接', 'error');
                return Promise.reject(error);
            }

        const status = response.status;
        const url = (config && config.url) || '';
        const isAuthPath = /\/users\/(login|register|refresh)/.test(url);

        if (status === 401 && !config._retry && !isAuthPath) {
            config._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                    refreshPromise = apiClient.post('/users/refresh', {}, { withCredentials: true })
                    .then((res) => {
                        const newToken = res?.data?.token;
                        const user = res?.data?.user;
                        if (newToken) {
                            localStorage.setItem('token', newToken);
                            window.dispatchEvent(new CustomEvent('auth:token', { detail: { token: newToken, user } }));
                                showToast('登录状态已自动续期', 'info');
                            onRefreshed(newToken);
                        }
                        return newToken;
                    })
                    .catch((e) => {
                            logout(); // 使用从 AuthContext 传入的 logout
                            showToast('登录已过期，请重新登录', 'error');
                        try { onRefreshed(null); } catch (_) {}
                        throw e;
                    })
                    .finally(() => {
                        isRefreshing = false;
                        refreshPromise = null;
                    });
            }

            return new Promise((resolve, reject) => {
                subscribeTokenRefresh((newToken) => {
                    if (!newToken) {
                        reject(error);
                        return;
                    }
                    config.headers['x-auth-token'] = newToken;
                    resolve(apiClient(config));
                });
            });
        }

            // 全局错误提示逻辑
            const message = response.data?.msg || error.message;
            if (status >= 500) {
                showToast('服务器开小差了，请稍后再试', 'error');
            } else if (status === 413) {
                showToast('提交的内容太大了，请删减一些', 'error');
            } else if (status === 400) {
                showToast(message || '请求格式有误，请检查', 'error');
            } else if (status !== 401) { // 401 错误由上面处理，不重复提示
                showToast(message, 'error');
            }

        return Promise.reject(error);
    }
);

    // 返回一个清理函数，用于在组件卸载时移除拦截器
    return () => {
        apiClient.interceptors.response.eject(interceptorId);
    };
};

export default apiClient;
