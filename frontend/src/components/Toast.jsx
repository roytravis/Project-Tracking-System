import { useState, useEffect } from 'react';

export default function Toast({ toasts, onRemove }) {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }) {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 3500);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const icons = { success: '✓', error: '✕', info: 'ℹ' };

    return (
        <div className={`toast toast-${toast.type || 'info'}`}>
            <span>{icons[toast.type] || 'ℹ'}</span>
            <span>{toast.message}</span>
        </div>
    );
}
