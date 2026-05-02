import React from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useToast, ToastType } from '../../context/ToastContext';

const toastStyles: Record<ToastType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'rgba(0, 214, 143, 0.1)',
    border: 'rgba(0, 214, 143, 0.3)',
    text: '#00D68F',
    icon: <CheckCircle size={18} />,
  },
  error: {
    bg: 'rgba(255, 77, 79, 0.1)',
    border: 'rgba(255, 77, 79, 0.3)',
    text: '#FF4D4F',
    icon: <XCircle size={18} />,
  },
  warning: {
    bg: 'rgba(255, 170, 0, 0.1)',
    border: 'rgba(255, 170, 0, 0.3)',
    text: '#FFAA00',
    icon: <AlertCircle size={18} />,
  },
  info: {
    bg: 'rgba(22, 93, 255, 0.1)',
    border: 'rgba(22, 93, 255, 0.3)',
    text: '#165DFF',
    icon: <Info size={18} />,
  },
};

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] animate-in slide-in-from-right fade-in duration-300"
            style={{
              background: 'var(--card)',
              border: `1px solid ${style.border}`,
            }}
          >
            <div style={{ color: style.text }}>{style.icon}</div>
            <div className="flex-1 text-sm text-white">{toast.message}</div>
            <button
              onClick={() => hideToast(toast.id)}
              className="p-1 hover:bg-opacity-20 rounded"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
