import { useToast } from '../../context/useToast.js';

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (!toasts.length) return null;

  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.type}`}>
          <span className="toast-icon">{iconMap[toast.type] || 'ℹ️'}</span>
          <div className="toast-content">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            <div className="toast-message">{toast.message}</div>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => dismissToast(toast.id)}
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
