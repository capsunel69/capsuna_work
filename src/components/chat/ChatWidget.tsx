import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Button, IconButton, Spinner, EmptyState } from '../ui/primitives';
import { IconBot, IconSend, IconStop, IconRefresh, IconX } from '../ui/icons';
import StepCard from '../agents/StepCard';
import { useChat } from '../../context/ChatContext';

/* ── Floating launcher bubble ──────────────────────────────────────────── */

const Bubble = styled.button<{ $hidden: boolean }>`
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: ${(p) => (p.$hidden ? 'none' : 'grid')};
  place-items: center;
  background: linear-gradient(135deg, var(--accent), var(--purple));
  color: #06121d;
  border: none;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.45), 0 0 36px var(--accent-glow);
  cursor: pointer;
  z-index: 180;
  transition: transform 0.15s ease, box-shadow 0.2s ease;

  &:hover { transform: translateY(-2px) scale(1.04); }
  &:active { transform: translateY(0) scale(0.98); }

  svg { width: 24px; height: 24px; }
`;

const StatusDot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--success);
  box-shadow: 0 0 10px var(--success);
  border: 2px solid var(--bg-0);
`;

/* ── Drawer ────────────────────────────────────────────────────────────── */

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0.4; }
  to { transform: translateX(0); opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 180;
  background: rgba(2, 4, 8, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
`;

const Panel = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(480px, 96vw);
  background: var(--bg-1);
  border-left: 1px solid var(--border-1);
  box-shadow: -12px 0 48px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  z-index: 181;
  animation: ${slideIn} 0.22s ease-out;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--border-1);
  flex-shrink: 0;
  background: var(--bg-1);
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  display: flex;
  align-items: center;
  gap: var(--s-2);

  svg { color: var(--accent); }
`;

const Subtle = styled.span`
  font-size: 11px;
  color: var(--text-3);
  font-family: var(--font-mono);
  margin-left: var(--s-2);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--s-2);
`;

const Scroller = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--s-4) var(--s-4);
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
`;

const Turn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const UserLine = styled.div`
  align-self: flex-end;
  background: var(--accent-soft);
  color: var(--text-1);
  border-radius: var(--r-md);
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  max-width: 85%;
  word-wrap: break-word;
`;

const AgentColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  align-self: flex-start;
  max-width: 100%;
  width: 100%;
`;

const TurnFooter = styled.div`
  display: flex;
  gap: var(--s-3);
  font-size: 11px;
  color: var(--text-3);
  padding: 0 2px;
  font-family: var(--font-mono);
`;

const Composer = styled.form`
  border-top: 1px solid var(--border-1);
  padding: var(--s-3) var(--s-4);
  display: flex;
  gap: var(--s-3);
  align-items: flex-end;
  background: var(--bg-1);
  flex-shrink: 0;
`;

const TextInput = styled.textarea`
  flex: 1;
  min-height: 44px;
  max-height: 160px;
  resize: none;
  background: var(--bg-2);
  border: 1px solid var(--border-2);
  border-radius: var(--r-sm);
  color: var(--text-1);
  font: inherit;
  font-size: 14px;
  padding: 10px 12px;
  line-height: 1.5;
  outline: none;

  &:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  &::placeholder { color: var(--text-4); }
`;

const ChatWidget: React.FC = () => {
  const { turns, status, send, abort, reset, isOpen, open, close } = useChat();
  const [value, setValue] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, status, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => textareaRef.current?.focus(), 260);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!value.trim() || status === 'streaming') return;
    const text = value;
    setValue('');
    void send(text);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      <Bubble $hidden={isOpen} onClick={open} aria-label="Open assistant">
        <IconBot />
        <StatusDot />
      </Bubble>

      {isOpen && (
        <>
          <Overlay onClick={close} />
          <Panel role="dialog" aria-modal="true" aria-label="Assistant">
            <Header>
              <Title>
                <IconBot />
                Assistant
                <Subtle>
                  {status === 'streaming'
                    ? 'streaming…'
                    : turns.length
                      ? `${turns.length} turn${turns.length === 1 ? '' : 's'}`
                      : 'idle'}
                </Subtle>
              </Title>
              <HeaderActions>
                {turns.length > 0 && (
                  <Button type="button" $variant="ghost" $size="sm" onClick={reset}>
                    <IconRefresh />
                    Reset
                  </Button>
                )}
                <IconButton $variant="ghost" onClick={close} aria-label="Close">
                  <IconX />
                </IconButton>
              </HeaderActions>
            </Header>

            <Scroller ref={scrollRef}>
              {turns.length === 0 ? (
                <EmptyState>
                  <IconBot />
                  <div>Ask the agent anything — add a task, schedule a meeting, set a reminder.</div>
                </EmptyState>
              ) : (
                turns.map((turn) => (
                  <Turn key={turn.id}>
                    <UserLine>{turn.input}</UserLine>
                    <AgentColumn>
                      {turn.steps.map((step, i) => (
                        <StepCard key={i} step={step} />
                      ))}
                      {turn.status === 'streaming' && (
                        <TurnFooter>
                          <Spinner $size={12} /> thinking…
                        </TurnFooter>
                      )}
                      {turn.error && (
                        <TurnFooter style={{ color: 'var(--danger)' }}>{turn.error}</TurnFooter>
                      )}
                      {turn.status === 'idle' && turn.runId && (
                        <TurnFooter>
                          <span>run {turn.runId.slice(0, 8)}</span>
                          {turn.tokensIn !== null && <span>in {turn.tokensIn}</span>}
                          {turn.tokensOut !== null && <span>out {turn.tokensOut}</span>}
                        </TurnFooter>
                      )}
                    </AgentColumn>
                  </Turn>
                ))
              )}
            </Scroller>

            <Composer onSubmit={handleSubmit}>
              <TextInput
                ref={textareaRef}
                placeholder="Ask the agent… (Shift+Enter for newline)"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
              />
              {status === 'streaming' ? (
                <Button type="button" $variant="danger" onClick={abort}>
                  <IconStop />
                  Stop
                </Button>
              ) : (
                <Button type="submit" $variant="primary" disabled={!value.trim()}>
                  <IconSend />
                  Send
                </Button>
              )}
            </Composer>
          </Panel>
        </>
      )}
    </>
  );
};

export default ChatWidget;
