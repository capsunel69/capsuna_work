import React from 'react';
import styled from 'styled-components';
import { Spinner } from '../ui/primitives';

interface Props {
  message?: string;
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-4);
  padding: var(--s-9) var(--s-5);
  text-align: center;
`;

const Message = styled.div`
  font-size: 13px;
  color: var(--text-2);
  letter-spacing: 0.02em;
`;

const LoadingState: React.FC<Props> = ({ message = 'Loading…' }) => (
  <Wrap>
    <Spinner $size={28} />
    <Message>{message}</Message>
  </Wrap>
);

export default LoadingState;
