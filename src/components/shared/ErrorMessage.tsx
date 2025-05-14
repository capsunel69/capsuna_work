import React from 'react';
import styled from 'styled-components';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  margin: 20px 0;
  background-color: #fff;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
`;

const ErrorIcon = styled.div`
  width: 48px;
  height: 48px;
  background-color: #ff0000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 32px;
  margin-bottom: 16px;
`;

const ErrorTitle = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #cc0000;
  margin-bottom: 8px;
`;

const ErrorText = styled.div`
  font-size: 1rem;
  color: #333;
  text-align: center;
  margin-bottom: 16px;
`;

const RetryButton = styled.button`
  padding: 8px 20px;
  background: linear-gradient(to bottom, #4f94ea, #3a7bd5);
  color: white;
  border: 1px solid #2c5ea9;
  border-radius: 3px;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to bottom, #5ca0ff, #4485e6);
  }
  
  &:active {
    background: #3a7bd5;
  }
`;

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <ErrorContainer>
      <ErrorIcon>!</ErrorIcon>
      <ErrorTitle>Error</ErrorTitle>
      <ErrorText>{message}</ErrorText>
      {onRetry && <RetryButton onClick={onRetry}>Retry</RetryButton>}
    </ErrorContainer>
  );
};

export default ErrorMessage; 