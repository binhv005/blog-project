import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    info: (msg, duration) => showToast(msg, 'info', duration),
    warning: (msg, duration) => showToast(msg, 'warning', duration),
  };

  const getIconAndStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: 'check_circle',
          iconColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/40',
          bgGlow: 'bg-emerald-500/10',
          progressColor: 'bg-emerald-500'
        };
      case 'error':
        return {
          icon: 'error',
          iconColor: 'text-rose-400',
          borderColor: 'border-rose-500/40',
          bgGlow: 'bg-rose-500/10',
          progressColor: 'bg-rose-500'
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: 'text-amber-400',
          borderColor: 'border-amber-500/40',
          bgGlow: 'bg-amber-500/10',
          progressColor: 'bg-amber-500'
        };
      case 'info':
      default:
        return {
          icon: 'info',
          iconColor: 'text-[#4cd7f6]',
          borderColor: 'border-[#4cd7f6]/40',
          bgGlow: 'bg-[#4cd7f6]/10',
          progressColor: 'bg-[#4cd7f6]'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const style = getIconAndStyle(t.type);
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[#1c152c]/95 border ${style.borderColor} shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl text-white transform transition-all duration-300 animate-in slide-in-from-top-4 fade-in relative overflow-hidden`}
            >
              {/* Left Type Icon */}
              <div className={`p-2 rounded-xl ${style.bgGlow} flex-shrink-0 flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-xl ${style.iconColor}`}>
                  {style.icon}
                </span>
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs sm:text-sm font-medium text-slate-100 leading-snug break-words">
                  {t.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 -mr-1 -mt-1"
                title="Đóng thông báo"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>

              {/* Progress bar animation */}
              {t.duration > 0 && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${style.progressColor} opacity-70 animate-toast-progress`}
                  style={{ animationDuration: `${t.duration}ms` }}
                />
              )}
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
    // Fallback if rendered outside provider
    const fallbackToast = {
      success: (msg) => console.log('[Toast success]:', msg),
      error: (msg) => console.error('[Toast error]:', msg),
      info: (msg) => console.info('[Toast info]:', msg),
      warning: (msg) => console.warn('[Toast warning]:', msg),
    };
    return {
      ...fallbackToast,
      showToast: (msg) => console.log('[Toast fallback]:', msg),
      toast: fallbackToast
    };
  }
  return {
    ...context.toast,
    toast: context.toast,
    showToast: context.showToast
  };
}

