import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { IconX } from '../ui/icons';
import { IconButton } from '../ui/primitives';
import { useRegisterOverlay } from '../../hooks/useOverlayStack';

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 150;
  background: rgba(2, 4, 8, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
`;

const Panel = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(640px, 92vw);
  background: var(--bg-1);
  border-left: 1px solid var(--border-1);
  box-shadow: -12px 0 48px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  z-index: 151;
  animation: ${slideIn} 0.22s ease-out;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--border-1);
  flex-shrink: 0;
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  display: flex;
  align-items: center;
  gap: var(--s-2);
`;

const Body = styled.div`
  flex: 1;
  overflow: auto;
  padding: var(--s-5);
`;

interface DrawerProps {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({ open, title, onClose, children }) => {
  useRegisterOverlay(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <Panel role="dialog" aria-modal="true">
        <Header>
          <Title>{title}</Title>
          <IconButton $variant="ghost" onClick={onClose} aria-label="Close">
            <IconX />
          </IconButton>
        </Header>
        <Body>{children}</Body>
      </Panel>
    </>
  );
};

export default Drawer;
