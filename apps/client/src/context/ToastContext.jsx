import { useState, useCallback } from 'react';
import { ToastContext } from './ToastContextInstance.js';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ type = 'info', title = '', message = '', duration = 4500 }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const newToast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  }, [dismissToast]);

  const success = useCallback((message, title = 'Success') => {
    return showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((message, title = 'Error') => {
    return showToast({ type: 'error', title, message, duration: 6000 });
  }, [showToast]);

  const warning = useCallback((message, title = 'Warning') => {
    return showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = useCallback((message, title = 'Notification') => {
    return showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  );
}
