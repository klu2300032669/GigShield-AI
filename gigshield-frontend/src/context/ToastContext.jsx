import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((type, message, duration = 3500) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      // trigger exit animation
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 320);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320);
  }, []);

  const showSuccess = useCallback((msg, dur) => addToast('success', msg, dur), [addToast]);
  const showError   = useCallback((msg, dur) => addToast('error',   msg, dur), [addToast]);
  const showInfo    = useCallback((msg, dur) => addToast('info',    msg, dur), [addToast]);
  const showWarning = useCallback((msg, dur) => addToast('warning', msg, dur), [addToast]);

  const iconMap = {
    success: <CheckCircle2 size={16} />,
    error:   <XCircle size={16} />,
    info:    <Info size={16} />,
    warning: <AlertTriangle size={16} />,
  };

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}
            onClick={() => removeToast(t.id)}
          >
            <span className={`toast-icon`}>{iconMap[t.type]}</span>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" onClick={(e) => { e.stopPropagation(); removeToast(t.id); }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
