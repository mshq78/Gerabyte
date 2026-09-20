import { KeyboardEvent } from 'react';

/**
 * Props that make a non-semantic clickable element (a card, a row, a drop zone)
 * operable by keyboard as well as mouse. Prefer a real <button>; use this only
 * where button styling would fight the layout.
 */
export function clickableProps(onActivate: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onActivate();
      }
    },
  };
}
