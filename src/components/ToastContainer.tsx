import React from 'react';
import Toast from './Toast';
import { Toast as ToastData } from '../contexts/ToastContext';

interface ToastContainerProps {
    toasts: ToastData[];
    removeToast: (id: number) => void;
}

const ToastContainer = ({ toasts, removeToast }: ToastContainerProps) => {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onDismiss={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

export default ToastContainer;
