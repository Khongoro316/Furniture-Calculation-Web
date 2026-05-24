'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: '#ecfdf5', border: '#86efac', color: '#166534', icon: 'OK' },
  error: { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: 'ER' },
  info: { bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8', icon: 'IN' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateY(8px) translateX(8px); }
          to { opacity: 1; transform: translateY(0) translateX(0); }
        }
        .app-toast-wrap {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }
        .app-toast {
          min-width: 260px;
          max-width: 360px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
          pointer-events: auto;
          animation: toast-slide-in 0.2s ease-out;
        }
        .app-toast-badge {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          flex-shrink: 0;
          background: rgba(255,255,255,0.85);
        }
        .app-toast-text {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.5;
        }
        @media (max-width: 640px) {
          .app-toast-wrap {
            left: 16px;
            right: 16px;
            top: 14px;
          }
          .app-toast {
            min-width: 0;
            max-width: none;
            width: 100%;
          }
        }
      `}</style>
      <div className="app-toast-wrap">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className="app-toast"
              style={{ background: style.bg, borderColor: style.border, color: style.color }}
            >
              <div className="app-toast-badge" style={{ color: style.color }}>
                {style.icon}
              </div>
              <div className="app-toast-text">{toast.message}</div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
