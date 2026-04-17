import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { IconCheck, IconAlert, IconX, IconBell } from './icons';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  description?: string;
}

interface ToastAPI {
  toast: (message: string, opts?: { variant?: ToastVariant; description?: string; duration?: number }) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

export const useToast = (): ToastAPI => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const slideOut = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(-8px) scale(0.98); }
`;

const Stack = styled.div`
  position: fixed;
  top: calc(var(--topbar-h, 56px) + 12px);
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
  pointer-events: none;

  @media (max-width: 720px) {
    left: 12px;
    right: 12px;
    align-items: stretch;
  }
`;

const Item = styled.div<{ $variant: ToastVariant; $leaving: boolean }>`
  pointer-events: auto;
  min-width: 280px;
  max-width: 380px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--r-md);
  background: linear-gradient(180deg, var(--bg-3), var(--bg-2));
  border: 1px solid var(--border-2);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  font-size: 13px;
  color: var(--text-1);
  animation: ${p => (p.$leaving ? slideOut : slideIn)} 180ms ease-out forwards;
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: ${p =>
      p.$variant === 'success' ? 'var(--success)' :
      p.$variant === 'error'   ? 'var(--danger)' :
                                 'var(--accent)'};
    box-shadow: 0 0 12px ${p =>
      p.$variant === 'success' ? 'var(--success)' :
      p.$variant === 'error'   ? 'var(--danger)' :
                                 'var(--accent)'};
  }

  .iconwrap {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    display: grid;
    place-items: center;
    background: ${p =>
      p.$variant === 'success' ? 'rgba(34, 197, 94, 0.14)' :
      p.$variant === 'error'   ? 'rgba(255, 93, 108, 0.14)' :
                                 'rgba(76, 194, 255, 0.14)'};
    color: ${p =>
      p.$variant === 'success' ? 'var(--success)' :
      p.$variant === 'error'   ? 'var(--danger)' :
                                 'var(--accent)'};
    margin-top: 1px;

    svg { width: 14px; height: 14px; }
  }

  .body { flex: 1; min-width: 0; line-height: 1.4; }
  .title { font-weight: 500; }
  .desc {
    color: var(--text-3);
    font-size: 12px;
    margin-top: 2px;
  }

  .close {
    color: var(--text-3);
    background: none;
    border: 0;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: color .15s, background .15s;
    flex-shrink: 0;

    &:hover { color: var(--text-1); background: var(--bg-1); }
    svg { width: 14px; height: 14px; }
  }
`;

const VariantIcon: React.FC<{ variant: ToastVariant }> = ({ variant }) => {
  if (variant === 'success') return <IconCheck />;
  if (variant === 'error')   return <IconAlert />;
  return <IconBell />;
};

interface ProviderState {
  items: ToastItem[];
  leaving: Set<number>;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ProviderState>({ items: [], leaving: new Set() });
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setState(prev => {
      const leaving = new Set(prev.leaving);
      leaving.add(id);
      return { ...prev, leaving };
    });
    setTimeout(() => {
      setState(prev => ({
        items: prev.items.filter(it => it.id !== id),
        leaving: new Set([...prev.leaving].filter(x => x !== id)),
      }));
    }, 180);
  }, []);

  const push = useCallback(
    (
      message: string,
      opts: { variant?: ToastVariant; description?: string; duration?: number } = {},
    ) => {
      const id = ++idRef.current;
      const item: ToastItem = {
        id,
        message,
        variant: opts.variant ?? 'info',
        description: opts.description,
      };
      setState(prev => ({ ...prev, items: [...prev.items, item] }));
      const duration = opts.duration ?? (opts.variant === 'error' ? 5000 : 3200);
      setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  const api: ToastAPI = {
    toast: push,
    success: (m, d) => push(m, { variant: 'success', description: d }),
    error:   (m, d) => push(m, { variant: 'error',   description: d }),
    info:    (m, d) => push(m, { variant: 'info',    description: d }),
  };

  // Render the stack via portal so it survives any layout containment
  const portal =
    typeof document !== 'undefined'
      ? createPortal(
          <Stack role="status" aria-live="polite">
            {state.items.map(item => (
              <Item key={item.id} $variant={item.variant} $leaving={state.leaving.has(item.id)}>
                <span className="iconwrap"><VariantIcon variant={item.variant} /></span>
                <div className="body">
                  <div className="title">{item.message}</div>
                  {item.description && <div className="desc">{item.description}</div>}
                </div>
                <button className="close" aria-label="Dismiss" onClick={() => remove(item.id)}>
                  <IconX />
                </button>
              </Item>
            ))}
          </Stack>,
          document.body,
        )
      : null;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {portal}
    </ToastContext.Provider>
  );
};

// Side-effect free hook to auto-dismiss on route change if needed by callers.
// (Currently unused – kept for completeness.)
export const useDismissOnUnmount = () => {
  useEffect(() => {
    return () => {};
  }, []);
};
