import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { IconButton, Spinner } from '../ui/primitives';
import { IconBot, IconSend, IconStop, IconRefresh, IconX } from '../ui/icons';
import StepCard from '../agents/StepCard';
import { useChat } from '../../context/ChatContext';
import { useOverlayCount } from '../../hooks/useOverlayStack';

/* ── Launcher bubble ───────────────────────────────────────────────────── */

const pulse = keyframes`
  0%   { box-shadow: 0 10px 32px rgba(0,0,0,0.45), 0 0 0 0 var(--accent-soft); }
  70%  { box-shadow: 0 10px 32px rgba(0,0,0,0.45), 0 0 0 14px rgba(76,194,255,0); }
  100% { box-shadow: 0 10px 32px rgba(0,0,0,0.45), 0 0 0 0 rgba(76,194,255,0); }
`;

const BubbleWrap = styled.div<{ $hidden: boolean }>`
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 180;
  display: ${(p) => (p.$hidden ? 'none' : 'flex')};
  align-items: center;
  gap: 10px;

  @media (max-width: 720px) {
    right: 14px;
    bottom: 14px;
  }
`;

const BubbleLabel = styled.span`
  background: var(--bg-2);
  border: 1px solid var(--border-2);
  color: var(--text-1);
  font-size: 12px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  opacity: 0;
  transform: translateX(8px);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    right: -5px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: var(--bg-2);
    border-right: 1px solid var(--border-2);
    border-top: 1px solid var(--border-2);
  }
  position: relative;
`;

const BubbleButton = styled.button`
  position: relative;
  width: 58px;
  height: 58px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: radial-gradient(120% 120% at 30% 20%, #62d8ff 0%, var(--accent) 45%, var(--purple) 100%);
  color: #06121d;
  border: none;
  cursor: pointer;
  animation: ${pulse} 2.6s ease-out infinite;
  transition: transform 0.18s ease, filter 0.18s ease;

  svg { width: 26px; height: 26px; }

  &:hover { transform: translateY(-2px) scale(1.04); filter: brightness(1.05); }
  &:active { transform: translateY(0) scale(0.97); }
`;

const StatusDot = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: var(--success);
  box-shadow: 0 0 10px var(--success);
  border: 2px solid #06121d;
`;

const HoverRevealWrap = styled(BubbleWrap)`
  &:hover ${BubbleLabel} {
    opacity: 1;
    transform: translateX(0);
  }
`;

/* ── Drawer ────────────────────────────────────────────────────────────── */

const slideIn = keyframes`
  from { transform: translateX(16px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 180;
  background: rgba(2, 4, 8, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: ${fadeIn} 0.18s ease-out;
`;

const Panel = styled.aside`
  position: fixed;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: min(460px, calc(100vw - 24px));
  background: linear-gradient(180deg, var(--bg-1), var(--bg-2));
  border: 1px solid var(--border-2);
  border-radius: var(--r-lg);
  box-shadow: -24px 24px 72px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(76, 194, 255, 0.05);
  display: flex;
  flex-direction: column;
  z-index: 181;
  animation: ${slideIn} 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;

  @media (max-width: 720px) {
    top: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    border-radius: 0;
    border: none;
  }
`;

const GradientBar = styled.div`
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent), var(--purple), transparent);
  opacity: 0.7;
  flex-shrink: 0;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-1);
  flex-shrink: 0;
  background: rgba(7, 9, 13, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
`;

const TitleBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--accent), var(--purple));
  color: #06121d;
  box-shadow: 0 0 20px var(--accent-glow);
  flex-shrink: 0;

  svg { width: 18px; height: 18px; }
`;

const TitleText = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;

  strong {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-1);
    letter-spacing: 0.01em;
  }
  span {
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const HeaderChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--border-1);
  background: var(--bg-2);
  color: var(--text-2);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &:hover { background: var(--bg-3); color: var(--text-1); border-color: var(--border-2); }
  svg { width: 13px; height: 13px; }
`;

const LiveDot = styled.span<{ $live: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: ${(p) => (p.$live ? 'var(--success)' : 'var(--text-4)')};
  ${(p) =>
    p.$live &&
    css`
      box-shadow: 0 0 8px var(--success);
    `}
`;

const Scroller = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
`;

const Turn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const UserLine = styled.div`
  align-self: flex-end;
  background: linear-gradient(135deg, var(--accent-soft), rgba(164, 120, 255, 0.15));
  color: var(--text-1);
  border: 1px solid rgba(76, 194, 255, 0.2);
  border-radius: 16px 16px 4px 16px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  max-width: 88%;
  word-wrap: break-word;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
`;

const AgentColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-self: flex-start;
  max-width: 100%;
  width: 100%;
`;

const TurnFooter = styled.div`
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-4);
  padding: 0 2px;
  font-family: var(--font-mono);
  align-items: center;
`;

/* ── Empty state with suggestions ──────────────────────────────────────── */

const EmptyWrap = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 32px 12px;
  color: var(--text-3);
  text-align: center;
`;

const EmptyAvatar = styled(Avatar)`
  width: 54px;
  height: 54px;
  border-radius: 18px;
  svg { width: 28px; height: 28px; }
`;

const EmptyTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
`;

const EmptyHint = styled.div`
  font-size: 12.5px;
  max-width: 320px;
  line-height: 1.55;
`;

const Suggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 6px;
`;

const SuggestionChip = styled.button`
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 999px;
  border: 1px solid var(--border-2);
  background: var(--bg-2);
  color: var(--text-2);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;

  &:hover {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent);
    transform: translateY(-1px);
  }
`;

/* ── Composer ──────────────────────────────────────────────────────────── */

const ComposerBar = styled.form`
  border-top: 1px solid var(--border-1);
  padding: 10px 12px 12px;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: rgba(7, 9, 13, 0.4);
  flex-shrink: 0;
`;

const TextInputWrap = styled.div<{ $focused: boolean; $disabled: boolean }>`
  flex: 1;
  display: flex;
  align-items: flex-end;
  background: var(--bg-2);
  border: 1px solid ${(p) => (p.$focused ? 'var(--accent)' : 'var(--border-2)')};
  border-radius: 14px;
  padding: 4px 6px 4px 12px;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-shadow: ${(p) => (p.$focused ? '0 0 0 3px var(--accent-soft)' : 'none')};
  opacity: ${(p) => (p.$disabled ? 0.6 : 1)};
`;

const TextInput = styled.textarea`
  flex: 1;
  min-height: 40px;
  max-height: 160px;
  resize: none;
  background: transparent;
  border: 0;
  color: var(--text-1);
  font: inherit;
  font-size: 14px;
  padding: 10px 2px;
  line-height: 1.5;
  outline: none;

  &::placeholder { color: var(--text-4); }
`;

const SendButton = styled.button<{ $variant: 'send' | 'stop' }>`
  width: 38px;
  height: 38px;
  margin: 3px;
  border-radius: 999px;
  border: none;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.15s, filter 0.15s, opacity 0.15s;
  flex-shrink: 0;

  ${(p) =>
    p.$variant === 'send'
      ? css`
          background: linear-gradient(135deg, var(--accent), var(--purple));
          color: #06121d;
          box-shadow: 0 4px 16px rgba(76, 194, 255, 0.3);
        `
      : css`
          background: var(--danger);
          color: #0b0306;
        `}

  &:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
  &:not(:disabled):hover { transform: scale(1.05); filter: brightness(1.08); }
  &:not(:disabled):active { transform: scale(0.95); }

  svg { width: 16px; height: 16px; }
`;

const Hint = styled.div`
  font-size: 10.5px;
  color: var(--text-4);
  text-align: right;
  padding: 4px 6px 0;
  font-family: var(--font-mono);
`;

/* ── Component ─────────────────────────────────────────────────────────── */

const SUGGESTIONS = [
  'Add a task for today',
  "What's on my agenda?",
  'Schedule a meeting tomorrow at 3pm',
  'Remind me to stretch at 5pm',
];

const ChatWidget: React.FC = () => {
  const { turns, status, send, abort, reset, isOpen, open, close, instanceId, setInstanceId } = useChat();
  const overlayCount = useOverlayCount();
  const bubbleHidden = isOpen || overlayCount > 0;
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
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

  const autoGrow = (el: HTMLTextAreaElement | null): void => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!value.trim() || status === 'streaming') return;
    const text = value;
    setValue('');
    autoGrow(textareaRef.current);
    void send(text);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const submitSuggestion = (text: string): void => {
    if (status === 'streaming') return;
    void send(text);
  };

  const streaming = status === 'streaming';

  return (
    <>
      <HoverRevealWrap $hidden={bubbleHidden}>
        <BubbleLabel>Ask Piovra</BubbleLabel>
        <BubbleButton onClick={() => open()} aria-label="Open assistant">
          <IconBot />
          <StatusDot />
        </BubbleButton>
      </HoverRevealWrap>

      {isOpen && (
        <>
          <Overlay onClick={close} />
          <Panel role="dialog" aria-modal="true" aria-label="Assistant">
            <GradientBar />
            <Header>
              <TitleBlock>
                <Avatar>
                  <IconBot />
                </Avatar>
                <TitleText>
                  <strong>Piovra</strong>
                  <span>
                    <LiveDot $live={!streaming} />
                    {streaming
                      ? 'thinking…'
                      : turns.length
                        ? `${turns.length} turn${turns.length === 1 ? '' : 's'}`
                        : 'ready'}
                  </span>
                </TitleText>
              </TitleBlock>
              <HeaderActions>
                {instanceId && (
                  <HeaderChip
                    type="button"
                    onClick={() => setInstanceId(undefined)}
                    title="Switch back to default instance"
                  >
                    inst {instanceId.slice(0, 6)} ×
                  </HeaderChip>
                )}
                {turns.length > 0 && (
                  <HeaderChip type="button" onClick={reset} title="Reset conversation">
                    <IconRefresh />
                    Reset
                  </HeaderChip>
                )}
                <IconButton $variant="ghost" onClick={close} aria-label="Close">
                  <IconX />
                </IconButton>
              </HeaderActions>
            </Header>

            <Scroller ref={scrollRef}>
              {turns.length === 0 ? (
                <EmptyWrap>
                  <EmptyAvatar>
                    <IconBot />
                  </EmptyAvatar>
                  <EmptyTitle>How can I help?</EmptyTitle>
                  <EmptyHint>
                    I can add tasks, schedule meetings, set reminders, and look things up. Try one
                    of these:
                  </EmptyHint>
                  <Suggestions>
                    {SUGGESTIONS.map((s) => (
                      <SuggestionChip
                        key={s}
                        type="button"
                        onClick={() => submitSuggestion(s)}
                        disabled={streaming}
                      >
                        {s}
                      </SuggestionChip>
                    ))}
                  </Suggestions>
                </EmptyWrap>
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

            <ComposerBar onSubmit={handleSubmit}>
              <div style={{ flex: 1 }}>
                <TextInputWrap $focused={focused} $disabled={streaming}>
                  <TextInput
                    ref={textareaRef}
                    placeholder="Message Piovra…"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      autoGrow(e.currentTarget);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={handleKey}
                    rows={1}
                    disabled={streaming}
                  />
                  {streaming ? (
                    <SendButton type="button" $variant="stop" onClick={abort} aria-label="Stop">
                      <IconStop />
                    </SendButton>
                  ) : (
                    <SendButton
                      type="submit"
                      $variant="send"
                      disabled={!value.trim()}
                      aria-label="Send"
                    >
                      <IconSend />
                    </SendButton>
                  )}
                </TextInputWrap>
                <Hint>Enter to send · Shift+Enter for newline · Esc to close</Hint>
              </div>
            </ComposerBar>
          </Panel>
        </>
      )}
    </>
  );
};

export default ChatWidget;
