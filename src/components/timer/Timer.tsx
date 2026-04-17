import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAppContext } from '../../context/AppContext';
import { Button, IconButton, Badge } from '../ui/primitives';
import { IconPlay, IconPause, IconStop, IconClock } from '../ui/icons';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

const Bar = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  margin: calc(-1 * var(--s-6)) calc(-1 * var(--s-7)) var(--s-5);
  padding: var(--s-3) var(--s-7);
  background: linear-gradient(180deg, rgba(76,194,255,0.10), rgba(76,194,255,0.04));
  border-bottom: 1px solid var(--accent-soft);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: var(--s-4);

  @media (max-width: 720px) {
    margin: calc(-1 * var(--s-4)) calc(-1 * var(--s-4)) var(--s-3);
    padding: var(--s-3) var(--s-4);
  }
`;

const TimeDisplay = styled.div<{ $paused?: boolean }>`
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 600;
  color: ${p => p.$paused ? 'var(--warning)' : 'var(--accent)'};
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  animation: ${p => p.$paused ? pulse : 'none'} 1.4s ease-in-out infinite;
  min-width: 110px;
`;

const TaskInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TaskName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: var(--s-2);
`;

const TaskMeta = styled.div`
  font-size: 11.5px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
`;

const formatTime = (s: number): string => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const Timer: React.FC = () => {
  const { tasks, activeTaskId, currentTimer, stopTimer, pauseTimer, resumeTimer, isPaused, breakTime } = useAppContext();
  const [display, setDisplay] = useState('00:00:00');
  const [breakDisplay, setBreakDisplay] = useState('00:00:00');

  useEffect(() => setDisplay(formatTime(currentTimer)), [currentTimer]);
  useEffect(() => setBreakDisplay(formatTime(breakTime)), [breakTime]);

  const activeTask = tasks.find(t => t.id === activeTaskId);
  if (!activeTaskId || !activeTask) return null;

  return (
    <Bar>
      <TimeDisplay $paused={isPaused}>{display}</TimeDisplay>
      <TaskInfo>
        <TaskName>
          <Badge $variant={isPaused ? 'warning' : 'accent'}><IconClock /> {isPaused ? 'Paused' : 'Tracking'}</Badge>
          <span>{activeTask.title}</span>
          {breakTime > 0 && <Badge $variant="warning">Break · {breakDisplay}</Badge>}
        </TaskName>
        {activeTask.timeSpent > 0 && <TaskMeta>Total: {formatTime(activeTask.timeSpent + currentTimer)}</TaskMeta>}
      </TaskInfo>
      {isPaused ? (
        <Button $variant="primary" $size="sm" onClick={() => resumeTimer()}>
          <IconPlay /> Resume
        </Button>
      ) : (
        <Button $variant="secondary" $size="sm" onClick={() => pauseTimer()}>
          <IconPause /> Pause
        </Button>
      )}
      <IconButton $variant="danger" $size="sm" onClick={() => stopTimer(activeTaskId)} title="Stop">
        <IconStop />
      </IconButton>
    </Bar>
  );
};

export default Timer;
