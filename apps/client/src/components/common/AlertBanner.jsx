export function AlertBanner({ type = 'info', title = '', message = '', onClose = null }) {
  if (!message) return null;

  const iconMap = {
    error: '⚠️',
    warning: '⚡',
    success: '✅',
    info: 'ℹ️',
  };

  return (
    <div className={`alert-banner alert-${type}`} role="alert">
      <div className="alert-content">
        <span className="alert-icon">{iconMap[type] || 'ℹ️'}</span>
        <div className="alert-body">
          {title && <strong className="alert-title">{title}: </strong>}
          <span className="alert-message">{message}</span>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          className="alert-close-btn"
          onClick={onClose}
          aria-label="Dismiss alert"
        >
          &times;
        </button>
      )}
    </div>
  );
}
