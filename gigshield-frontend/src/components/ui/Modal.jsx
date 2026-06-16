import { useEffect, useRef, useCallback } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

/**
 * Accessible Modal with:
 * - focus trap
 * - Esc key to close
 * - aria-modal, role="dialog"
 * - backdrop click to close
 */
export function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Trap focus inside modal
  const trapFocus = useCallback((e) => {
    if (!modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      // Focus first element
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 50);
      document.addEventListener('keydown', trapFocus);
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
      document.removeEventListener('keydown', trapFocus);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', trapFocus);
    };
  }, [isOpen, trapFocus]);

  if (!isOpen) return null;

  const sizeMap = { sm: '420px', md: '560px', lg: '720px', xl: '900px' };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
      aria-hidden="false"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal-box ${className}`}
        style={{ maxWidth: sizeMap[size] || sizeMap.md }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">{title}</h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Confirm Dialog — for destructive actions
 * Usage: <ConfirmDialog isOpen onConfirm onCancel title message variant="danger" />
 */
export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning'
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="confirm-dialog-body">
        <div className={`confirm-icon-wrap ${variant}`}>
          {variant === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button
            className="btn btn-outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
            autoFocus
          >
            {isLoading ? (
              <span className="btn-spinner" aria-label="Loading..." />
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default Modal;
