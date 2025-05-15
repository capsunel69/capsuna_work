import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../context/AppContext';

const TimerContainer = styled.div`
  padding: 8px;
  background-color: #000080;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #aeaeae, inset -1px -1px 0px 1px #000000;
`;

const TimerDisplay = styled.div<{ isPaused?: boolean }>`
  font-family: 'Courier New', Courier, monospace;
  font-size: 24px;
  font-weight: bold;
  background-color: #000000;
  color: ${props => props.isPaused ? '#ff6b6b' : '#00ff00'};
  padding: 4px 8px;
  border: 2px inset #888888;
`;

const TaskInfo = styled.div`
  margin-left: 16px;
  flex: 1;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'warning' | 'danger' }>`
  background: ${props => {
    switch (props.variant) {
      case 'warning':
        return 'linear-gradient(to bottom, #ffd700, #ffa500)';
      case 'danger':
        return 'linear-gradient(to bottom, #f96c6c, #e53e3e)';
      default:
        return 'linear-gradient(to bottom, #4CAF50, #45a049)';
    }
  }};
  color: white;
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid ${props => props.variant === 'danger' ? '#c53030' : '#2e7d32'};
  cursor: pointer;
  
  &:hover {
    background: ${props => {
      switch (props.variant) {
        case 'warning':
          return 'linear-gradient(to bottom, #ffe44d, #ffb347)';
        case 'danger':
          return 'linear-gradient(to bottom, #ff8080, #f05252)';
        default:
          return 'linear-gradient(to bottom, #66bb6a, #4caf50)';
      }
    }};
  }
  
  &:active {
    background: ${props => {
      switch (props.variant) {
        case 'warning':
          return '#ffa500';
        case 'danger':
          return '#e53e3e';
        default:
          return '#45a049';
      }
    }};
  }
`;

const BreakTimeDisplay = styled.div`
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  color: #ffd700;
  margin-top: 4px;
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
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Update display time whenever currentTimer changes
  useEffect(() => {
    setDisplayTime(formatTime(currentTimer));
  }, [currentTimer]);

  // Update break time display
  useEffect(() => {
    setDisplayBreakTime(formatTime(breakTime));
  }, [breakTime]);
  
  // Get active task
  const activeTask = tasks.find(task => task.id === activeTaskId);
  
  // If no active task, don't render anything
  if (!activeTaskId || !activeTask) {
    return null;
  }
  
  return (
    <TimerContainer>
      <TimerDisplay isPaused={isPaused}>
        {displayTime}
        {breakTime > 0 && (
          <BreakTimeDisplay>
            Break: {displayBreakTime}
          </BreakTimeDisplay>
        )}
      </TimerDisplay>
      
      <TaskInfo>
        <div><strong>Task:</strong> {activeTask.title}</div>
        {activeTask.timeSpent > 0 && (
          <div><strong>Total time spent:</strong> {formatTime(activeTask.timeSpent)}</div>
        )}
      </TaskInfo>
      
      <ButtonContainer>
        {isPaused ? (
          <ActionButton onClick={() => resumeTimer()}>
            Resume Timer
          </ActionButton>
        ) : (
          <ActionButton 
            variant="warning"
            onClick={() => pauseTimer()}
          >
            Pause Timer
          </ActionButton>
        )}
        <ActionButton 
          variant="danger"
          onClick={() => stopTimer(activeTaskId)}
        >
          Stop Timer
        </ActionButton>
      </ButtonContainer>
    </TimerContainer>
  );
};

export default Timer; 