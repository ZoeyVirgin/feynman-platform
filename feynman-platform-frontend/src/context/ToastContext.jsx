// src/context/ToastContext.jsx
import { createContext, useState, useCallback, useContext } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev =>
            prev.map(t => (t.id === id ? { ...t, isExiting: true } : t))
        );
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300); // 动画时长
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, isExiting: false }]);
        setTimeout(() => removeToast(id), duration);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast-item toast-${toast.type} ${toast.isExiting ? 'exiting' : ''}`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);

