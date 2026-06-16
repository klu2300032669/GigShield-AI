import { useEffect } from 'react';

/**
 * Global keyboard shortcuts.
 * Usage: useKeyboardShortcuts({ onSearch, onEscape })
 */
export function useKeyboardShortcuts({ onSearch, onEscape } = {}) {
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+K or Cmd+K → focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (onSearch) {
          onSearch();
        } else {
          // Try to focus any visible search input
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
          searchInput?.focus();
        }
      }
      // Escape → close modals / clear
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearch, onEscape]);
}

export default useKeyboardShortcuts;
