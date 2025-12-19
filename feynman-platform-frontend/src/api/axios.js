// src/api/axios.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api', // 通过 Vite 代理到后端，避免开发环境 CORS
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // 允许跨域发送 cookie（用于 refreshToken）
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
        const token = localStorage.getItem('token'); // 从localStorage获取token
        if (token) {
            config.headers['x-auth-token'] = token; // 添加到请求头
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 添加响应拦截器：捕获401后尝试静默刷新再重放原请求
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { response, config } = error || {};
        if (!response) return Promise.reject(error);

        const status = response.status;
        const url = (config && config.url) || '';
        const isAuthPath = /\/users\/(login|register|refresh)/.test(url);

        if (status === 401 && !config._retry && !isAuthPath) {
            config._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = apiClient.post(
                    '/users/refresh',
                    {},
                    { withCredentials: true }
                )
                    .then((res) => {
                        const newToken = res?.data?.token;
                        const user = res?.data?.user;
                        if (newToken) {
                            localStorage.setItem('token', newToken);
                            window.dispatchEvent(new CustomEvent('auth:token', { detail: { token: newToken, user } }));
                            // 友好提示：会话已自动续期
                            window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: '登录状态已自动续期' } }));
                            onRefreshed(newToken);
                        }
                        return newToken;
                    })
                    .catch((e) => {
                        localStorage.removeItem('token');
                        try { onRefreshed(null); } catch (_) {}
                        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'expired' } }));
                        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warn', message: '登录已过期，请重新登录' } }));
                        throw e;
                    })
                    .finally(() => {
                        isRefreshing = false;
                        refreshPromise = null;
                    });
            }

            // 等待刷新完成再重放
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

        return Promise.reject(error);
    }
);

export default apiClient;
