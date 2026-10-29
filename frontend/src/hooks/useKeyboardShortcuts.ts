import { useEffect } from 'react';

type ShortcutMap = {
  [key: string]: () => void;
};

export const useKeyboardShortcuts = (shortcuts: ShortcutMap) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, altKey, ctrlKey, shiftKey, target } = event;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;

      // Build combo string
      let combo = '';
      if (ctrlKey || event.metaKey) combo += 'Ctrl+';
      if (altKey) combo += 'Alt+';
      if (shiftKey) combo += 'Shift+';
      combo += key;

      // 1. CUSTOM SHORTCUTS (Highest Priority)
      // Standardize key by ignoring case for single letter combos
      const normalizedCombo = combo.replace(/.$/, c => c.toLowerCase());
      const normalizedComboUpper = combo.replace(/.$/, c => c.toUpperCase());

      if (shortcuts[combo]) {
        event.preventDefault();
        shortcuts[combo]();
        return;
      }
      if (shortcuts[normalizedCombo]) {
        event.preventDefault();
        shortcuts[normalizedCombo]();
        return;
      }
      if (shortcuts[normalizedComboUpper]) {
        event.preventDefault();
        shortcuts[normalizedComboUpper]();
        return;
      }
      
      // Check for standalone key in shortcuts (like 'Enter' or 'Escape')
      if (shortcuts[key]) {
          if (key === 'Escape' || key === 'Enter' || key.startsWith('F')) {
              shortcuts[key]();
              if (key === 'Escape') {
                 event.preventDefault();
                 return;
              }
          }
      }

      // 2. TALLY-LIKE FOCUS NAVIGATION
      const focusableSelector = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
      // Only get visible elements
      const focusableElements = Array.from(document.querySelectorAll(focusableSelector)).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
      }) as HTMLElement[];
      
      const currentIndex = focusableElements.indexOf(target as HTMLElement);

      // If no focusable element is focused, and user presses arrow down/right, focus the first element
      if (currentIndex === -1 && (key === 'ArrowDown' || key === 'ArrowRight')) {
          event.preventDefault();
          if (focusableElements.length > 0) focusableElements[0].focus();
          return;
      }

      if (currentIndex !== -1) {
        const elTarget = target as HTMLElement;
        if (key === 'Enter') {
            // If it's a link or button, explicitly trigger a click
            if (elTarget.tagName === 'A' || elTarget.tagName === 'BUTTON') {
                event.preventDefault();
                elTarget.click();
            } 
            // Only auto-move focus if it's NOT a textarea
            else if (elTarget.tagName !== 'TEXTAREA') {
                event.preventDefault();
                const next = focusableElements[currentIndex + 1];
                if (next) next.focus();
            }
        } else if (key === 'ArrowDown') {
            // For selects, let standard behavior work
            if (elTarget.tagName !== 'SELECT') {
                event.preventDefault();
                const next = focusableElements[currentIndex + 1];
                if (next) next.focus();
            }
        } else if (key === 'ArrowUp') {
            if (elTarget.tagName !== 'SELECT') {
                event.preventDefault();
                const prev = focusableElements[currentIndex - 1];
                if (prev) prev.focus();
            }
        } else if (key === 'ArrowRight') {
            // Only move on ArrowRight for links and buttons to prevent breaking text input cursor movement
            if (elTarget.tagName === 'A' || elTarget.tagName === 'BUTTON') {
                event.preventDefault();
                const next = focusableElements[currentIndex + 1];
                if (next) next.focus();
            }
        } else if (key === 'ArrowLeft') {
            // Only move on ArrowLeft for links and buttons
            if (elTarget.tagName === 'A' || elTarget.tagName === 'BUTTON') {
                event.preventDefault();
                const prev = focusableElements[currentIndex - 1];
                if (prev) prev.focus();
            }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
