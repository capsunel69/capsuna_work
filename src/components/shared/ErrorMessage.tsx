import React from 'react';
import styled from 'styled-components';
import { Button } from '../ui/primitives';
import { IconAlert } from '../ui/icons';

interface Props {
  message: string;
  onRetry?: () => void;
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-7);
  background: var(--bg-2);
  border: 1px solid var(--danger-soft);
  border-radius: var(--r-lg);
  text-align: center;
`;

const Icon = styled.div`
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--danger-soft);
  color: var(--danger);

  svg { width: 24px; height: 24px; }
`;

const Title = styled.div` font-size: 14px; font-weight: 600; color: var(--text-1); `;
const Text = styled.div` font-size: 13px; color: var(--text-2); max-width: 420px; `;

const ErrorMessage: React.FC<Props> = ({ message, onRetry }) => (
  <Wrap>
    <Icon><IconAlert /></Icon>
    <Title>Something went wrong</Title>
    <Text>{message}</Text>
    {onRetry && <Button $variant="primary" onClick={onRetry}>Retry</Button>}
  </Wrap>
);

export default ErrorMessage;
