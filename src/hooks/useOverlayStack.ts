import { useEffect, useSyncExternalStore } from 'react';

/**
 * Tiny pubsub so modal-style overlays (Drawer, confirm dialogs, etc.) can
 * register their open state globally. The floating chat bubble subscribes
 * and hides itself whenever anything is on top of the page, so its pulsing
 * circle never overlaps with a drawer's action buttons.
 */

const listeners = new Set<() => void>();
let count = 0;

function notify(): void {
  for (const l of listeners) l();
}

export function pushOverlay(): () => void {
  count += 1;
  notify();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    count = Math.max(0, count - 1);
    notify();
  };
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot(): number {
  return count;
}

export function useOverlayCount(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Call from a component that renders a modal/drawer to mark the stack. */
export function useRegisterOverlay(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const release = pushOverlay();
    return release;
  }, [active]);
}
