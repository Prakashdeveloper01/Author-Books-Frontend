import React, { useState, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import '../components/ui/Toast.css';

const ToastContext = createContext();

const iconMap = {
    success: <CheckCircle size={18} color="#22c55e" />,
    error: <AlertCircle size={18} color="#ef4444" />,
    info: <Info size={18} color="#3b82f6" />,
    warning: <AlertTriangle size={18} color="#f59e0b" />,
};

const titleMap = {
    success: 'Success',
    error: 'Error',
    info: 'Info',
    warning: 'Warning',
};

const Toast = ({ toast, onRemove }) => {
    const [exiting, setExiting] = useState(false);

    const handleClose = () => {
        setExiting(true);
        setTimeout(() => onRemove(toast.id), 240);
    };

    return (
        <div
            className={`toast ${toast.type} ${exiting ? 'toast-exit' : ''}`}
            style={{ '--toast-duration': `${toast.duration || 3000}ms` }}
        >
            <div className="toast-icon-wrap">
                {iconMap[toast.type] || iconMap.info}
            </div>
            <div className="toast-content">
                <div className="toast-title">{toast.customTitle || titleMap[toast.type] || 'Notification'}</div>
                <div className="toast-message">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={handleClose} aria-label="Dismiss">
                <X size={15} />
            </button>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 4000, customTitle = null) => {
        const id = Date.now().toString() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, duration, customTitle }]);

        if (duration) {
            setTimeout(() => {
                // trigger exit animation via state — actual removal happens in Toast component
                setToasts((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, _autoClose: true } : t))
                );
                setTimeout(() => removeToast(id), 250);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="toast-container" aria-live="polite" aria-atomic="false">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
