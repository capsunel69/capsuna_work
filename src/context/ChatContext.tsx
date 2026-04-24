import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useOrchestrate, type ChatStatus, type ChatTurn } from '../hooks/useOrchestrate';

interface ChatContextValue {
  turns: ChatTurn[];
  status: ChatStatus;
  send: (input: string) => Promise<void>;
  abort: () => void;
  reset: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { turns, status, send, abort, reset } = useOrchestrate(undefined);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo<ChatContextValue>(
    () => ({ turns, status, send, abort, reset, isOpen, open, close, toggle }),
    [turns, status, send, abort, reset, isOpen, open, close, toggle],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}
