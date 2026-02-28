import { useCallback, useRef } from 'react';

/**
 * Hook that creates a spotlight effect following the mouse cursor on a card.
 * Sets CSS custom properties --spotlight-x and --spotlight-y on the element.
 * Use with the `.spotlight-card` CSS class from globals.css.
 */
export function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty('--spotlight-x', `${x}px`);
    el.style.setProperty('--spotlight-y', `${y}px`);
  }, []);

  return { ref, onMouseMove };
}
