import React, { useState } from 'react';
import styled from 'styled-components';
import type { AgentStep } from '../../services/piovra';
import { Badge } from '../ui/primitives';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const AssistantBubble = styled.div`
  background: var(--bg-2);
  border: 1px solid var(--border-1);
  border-radius: var(--r-md);
  padding: 10px 14px;
  color: var(--text-1);
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  max-width: 100%;
  word-wrap: break-word;
`;

const UserBubble = styled.div`
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

const ThoughtLine = styled.div`
  color: var(--text-3);
  font-size: 12.5px;
  font-style: italic;
  padding: 2px 6px;
`;

const ToolCard = styled.div`
  border: 1px dashed var(--border-2);
  border-radius: var(--r-sm);
  background: var(--bg-1);
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-2);

  header {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    margin-bottom: 6px;
  }

  header .skill {
    font-family: var(--font-mono);
    color: var(--text-1);
    font-weight: 500;
  }

  pre {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--text-3);
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 180px;
    overflow: auto;
  }
`;

const ErrorBanner = styled.div`
  background: var(--danger-soft);
  color: var(--danger);
  border: 1px solid rgba(255, 93, 108, 0.25);
  border-radius: var(--r-sm);
  padding: 8px 12px;
  font-size: 13px;
`;

const Toggle = styled.button`
  background: transparent;
  border: 0;
  color: var(--text-3);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  margin-left: auto;

  &:hover { color: var(--text-1); }
`;

const formatJSON = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

interface StepCardProps {
  step: AgentStep;
}

/**
 * Renders a single AgentStep.
 *
 * Used both for live streaming (in ChatPanel) and for replaying persisted runs
 * (in RunDetail) so the two views stay visually identical.
 */
const StepCard: React.FC<StepCardProps> = ({ step }) => {
  const [expanded, setExpanded] = useState(false);

  switch (step.kind) {
    case 'message':
      if (step.role === 'user') return <UserBubble>{step.content}</UserBubble>;
      return <AssistantBubble>{step.content}</AssistantBubble>;

    case 'thought':
      return <ThoughtLine>{step.text}</ThoughtLine>;

    case 'tool_call':
      return (
        <ToolCard>
          <header>
            <Badge $variant="accent">call</Badge>
            <span className="skill">{step.skill}</span>
          </header>
          <pre>{formatJSON(step.args)}</pre>
        </ToolCard>
      );

    case 'tool_result': {
      const raw = formatJSON(step.result);
      const long = raw.length > 240;
      const shown = long && !expanded ? raw.slice(0, 240) + '…' : raw;
      return (
        <ToolCard>
          <header>
            <Badge $variant="success">result</Badge>
            <span className="skill">{step.skill}</span>
            {long ? (
              <Toggle onClick={() => setExpanded((v) => !v)}>
                {expanded ? 'collapse' : 'expand'}
              </Toggle>
            ) : null}
          </header>
          <pre>{shown}</pre>
        </ToolCard>
      );
    }

    case 'error':
      return <ErrorBanner>{step.message}</ErrorBanner>;
  }
};

export default StepCard;
export { Wrap as StepStack };
