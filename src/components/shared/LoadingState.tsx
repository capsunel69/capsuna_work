import React from 'react';
import styled, { keyframes } from 'styled-components';

interface LoadingStateProps {
  message?: string;
}

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 4px solid rgba(0, 0, 128, 0.2);
  border-top-color: #000080;
  animation: ${rotate} 1s linear infinite;
  margin-bottom: 16px;
`;

const Message = styled.div`
  font-size: 1.1rem;
  color: #333;
  margin-top: 8px;
`;

const LoadingBar = styled.div`
  width: 250px;
  height: 24px;
  border: 1px solid #adadad;
  background-color: #fff;
  position: relative;
  overflow: hidden;
  margin-top: 12px;
`;

const LoadingProgress = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 20%;
  background: linear-gradient(90deg, #245edb, #3a7bd5);
  animation: progress 1.5s infinite linear;
  
  @keyframes progress {
    0% {
      left: -20%;
    }
    100% {
      left: 100%;
    }
  }
`;

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <LoadingContainer>
      <Spinner />
      <Message>{message}</Message>
      <LoadingBar>
        <LoadingProgress />
      </LoadingBar>
    </LoadingContainer>
  );
};

export default LoadingState; 