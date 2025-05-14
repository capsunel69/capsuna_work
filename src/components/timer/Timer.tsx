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

const TimerDisplay = styled.div`
  font-family: 'Courier New', Courier, monospace;
  font-size: 24px;
  font-weight: bold;
  background-color: #000000;
  color: #00ff00;
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

const StopButton = styled.button`
  background: linear-gradient(to bottom, #f96c6c, #e53e3e);
  color: white;
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #c53030;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to bottom, #ff8080, #f05252);
  }
  
  &:active {
    background: #e53e3e;
  }
`;

const Timer: React.FC = () => {
  const { tasks, activeTaskId, currentTimer, stopTimer } = useAppContext();
  const [displayTime, setDisplayTime] = useState<string>("00:00:00");
  
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
  
  // Get active task
  const activeTask = tasks.find(task => task.id === activeTaskId);
  
  // If no active task, don't render anything
  if (!activeTaskId || !activeTask) {
    return null;
  }
  
  return (
    <TimerContainer>
      <TimerDisplay>
        {displayTime}
      </TimerDisplay>
      
      <TaskInfo>
        <div><strong>Task:</strong> {activeTask.title}</div>
      </TaskInfo>
      
      <ButtonContainer>
        <StopButton onClick={() => stopTimer(activeTaskId)}>
          Stop Timer
        </StopButton>
      </ButtonContainer>
    </TimerContainer>
  );
};

export default Timer; 