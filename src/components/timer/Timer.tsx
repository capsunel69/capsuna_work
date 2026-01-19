import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAppContext } from '../../context/AppContext';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

const TimerContainer = styled.div`
  padding: 12px 20px;
  background: #28a745;
  color: white;
  display: flex;
  align-items: center;
  gap: 20px;
  border-radius: 4px;
  margin-bottom: 15px;
`;

const TimerDisplay = styled.div<{ $isPaused?: boolean }>`
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 28px;
  font-weight: bold;
  background: rgba(0,0,0,0.3);
  color: ${props => props.$isPaused ? '#ffc107' : '#fff'};
  padding: 8px 20px;
  border-radius: 4px;
  min-width: 140px;
  text-align: center;
  animation: ${props => props.$isPaused ? pulse : 'none'} 1s ease-in-out infinite;
`;

const TaskInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const TaskName = styled.div`
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TaskMeta = styled.div`
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
`;

const BreakBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  background: rgba(255,193,7,0.2);
  color: #ffc107;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 10px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $variant?: 'resume' | 'pause' | 'stop' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'pause': return 'rgba(255,255,255,0.2)';
      case 'stop': return '#dc3545';
      default: return '#fff';
    }
  }};
  color: ${props => props.$variant === 'stop' || props.$variant === 'pause' ? '#fff' : '#1e7e34'};
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  
  &:hover {
    background: ${props => {
      switch (props.$variant) {
        case 'pause': return 'rgba(255,255,255,0.3)';
        case 'stop': return '#c82333';
        default: return '#f8f9fa';
      }
    }};
  }
`;

const Timer: React.FC = () => {
  const { 
    tasks, 
    activeTaskId, 
    currentTimer, 
    stopTimer,
    pauseTimer,
    resumeTimer,
    isPaused,
    breakTime 
  } = useAppContext();
  
  const [displayTime, setDisplayTime] = useState<string>("00:00:00");
  const [displayBreakTime, setDisplayBreakTime] = useState<string>("00:00:00");
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    setDisplayTime(formatTime(currentTimer));
  }, [currentTimer]);

  useEffect(() => {
    setDisplayBreakTime(formatTime(breakTime));
  }, [breakTime]);
  
  const activeTask = tasks.find(task => task.id === activeTaskId);
  
  if (!activeTaskId || !activeTask) {
    return null;
  }
  
  return (
    <TimerContainer>
      <TimerDisplay $isPaused={isPaused}>
        {displayTime}
      </TimerDisplay>
      
      <TaskInfo>
        <TaskName>
          {isPaused ? '⏸️' : '▶️'} {activeTask.title}
          {breakTime > 0 && <BreakBadge>☕ Break: {displayBreakTime}</BreakBadge>}
        </TaskName>
        {activeTask.timeSpent > 0 && (
          <TaskMeta>Total: {formatTime(activeTask.timeSpent + currentTimer)}</TaskMeta>
        )}
      </TaskInfo>
      
      <ButtonContainer>
        {isPaused ? (
          <ActionButton onClick={() => resumeTimer()}>
            ▶ Resume
          </ActionButton>
        ) : (
          <ActionButton $variant="pause" onClick={() => pauseTimer()}>
            ⏸ Pause
          </ActionButton>
        )}
        <ActionButton $variant="stop" onClick={() => stopTimer(activeTaskId)}>
          ⏹ Stop
        </ActionButton>
      </ButtonContainer>
    </TimerContainer>
  );
};

export default Timer;
