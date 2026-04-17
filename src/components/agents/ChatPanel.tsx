import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Button, Card, CardHeader, CardTitle, CardSubtle, EmptyState, Spinner } from '../ui/primitives';
import { IconBot, IconSend, IconStop, IconRefresh } from '../ui/icons';
import { useOrchestrate } from '../../hooks/useOrchestrate';
import StepCard from './StepCard';

const Shell = styled(Card)`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 220px);
  min-height: 480px;
`;

const Scroller = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--s-4) var(--s-5);
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
  max-width: 80%;
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
`;

const TextInput = styled.textarea`
  flex: 1;
  min-height: 44px;
  max-height: 180px;
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

interface ChatPanelProps {
  instanceId?: string;
  instanceName?: string | null;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ instanceId, instanceName }) => {
  const { turns, status, send, abort, reset } = useOrchestrate(instanceId);
  const [value, setValue] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, status]);

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
    <Shell>
      <CardHeader>
        <CardTitle>
          <IconBot />
          {instanceName ? `Chat · ${instanceName}` : 'Chat'}
        </CardTitle>
        <CardSubtle>
          {status === 'streaming' ? 'streaming…' : turns.length ? `${turns.length} turn${turns.length === 1 ? '' : 's'}` : 'idle'}
          {turns.length > 0 ? (
            <Button
              type="button"
              $variant="ghost"
              $size="sm"
              onClick={reset}
              style={{ marginLeft: 12 }}
            >
              <IconRefresh />
              Reset
            </Button>
          ) : null}
        </CardSubtle>
      </CardHeader>

      <Scroller ref={scrollRef}>
        {turns.length === 0 ? (
          <EmptyState>
            <IconBot />
            <div>Ask the agent anything — schedule something, create a task, or look up info.</div>
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
    </Shell>
  );
};

export default ChatPanel;
