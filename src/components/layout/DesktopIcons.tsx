import React from 'react';
import styled from 'styled-components';
import { Computer3, Notepad2 } from '@react95/icons';

const IconsContainer = styled.div`
  position: fixed;
  left: 15px;
  top: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 1000;
`;

const IconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  width: 75px;
  text-align: center;
  padding: 5px;
  border: 1px solid transparent;
  user-select: none;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const IconBox = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    width: 32px !important;
    height: 32px !important;
  }
`;

const IconText = styled.span`
  color: white;
  font-size: 12px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
  word-wrap: break-word;
`;

interface DesktopIconsProps {
  onDashboardClick: () => void;
  onNotesClick: () => void;
}

const DesktopIcons: React.FC<DesktopIconsProps> = ({
  onDashboardClick,
  onNotesClick
}) => {
  return (
    <IconsContainer>
      <IconWrapper onDoubleClick={onDashboardClick}>
        <IconBox>
          <Computer3 />
        </IconBox>
        <IconText>My Dashboard</IconText>
      </IconWrapper>
      <IconWrapper onDoubleClick={onNotesClick}>
        <IconBox>
          <Notepad2 />
        </IconBox>
        <IconText>My Notes</IconText>
      </IconWrapper>
    </IconsContainer>
  );
};

export default DesktopIcons; 