import { useEffect, useRef, useCallback } from 'react';

export function useGameFocus(isPlaying: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  const focusContainer = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(focusContainer, 50);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, focusContainer]);

  // Handle keyboard events at container level for better focus handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default browser shortcuts that might interfere
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }
    };

    container.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  return containerRef;
}