import React, { useState } from 'react';
import styled from 'styled-components';
import { Mspaint } from '@react95/icons';
import blissBackground from '../../assets/bliss-update.jpg';
import japanBackground from '../../assets/japan.jpg';
import japan2Background from '../../assets/japan-2.jpg';
import konohaBackground from '../../assets/konoha.png';

// Define types for our backgrounds
type Background = {
  id: string;
  name: string;
  src: string;
};

// Available backgrounds
const backgrounds: Background[] = [
  { id: 'bliss', name: 'Bliss', src: blissBackground },
  { id: 'japan', name: 'Japan', src: japanBackground },
  { id: 'japan2', name: 'Japan 2', src: japan2Background },
  { id: 'konoha', name: 'Konoha', src: konohaBackground },
];

// Export backgrounds for use in Layout
export const getBackgroundById = (id: string): string => {
  const background = backgrounds.find(bg => bg.id === id);
  return background ? background.src : blissBackground;
};

const SwitcherButton = styled.button`
  position: fixed;
  left: 15px;
  bottom: 15px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.9rem;
  background-color: #c0c0c0;
  border: 2px solid;
  border-color: #fff #999 #999 #fff;
  box-shadow: 1px 1px 0 #dfdfdf;
  border-radius: 0;
  cursor: pointer;
  
  &:hover {
    background-color: #d0d0d0;
  }
  
  &:active {
    border-color: #999 #fff #fff #999;
    box-shadow: inset 1px 1px 1px rgba(0, 0, 0, 0.2);
  }
`;

const MenuItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #000080;
    color: white;
  }
`;

const Menu = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 5px;
  background-color: #c0c0c0;
  border: 2px solid;
  border-color: #fff #999 #999 #fff;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  min-width: 120px;
  z-index: 1001;
`;

interface BackgroundSwitcherProps {
  onBackgroundChange: (backgroundId: string) => void;
}

const BackgroundSwitcher: React.FC<BackgroundSwitcherProps> = ({ onBackgroundChange }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  const handleBackgroundSelect = (background: Background) => {
    onBackgroundChange(background.id);
    setMenuOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <SwitcherButton onClick={toggleMenu}>
        <Mspaint />
        Theme
      </SwitcherButton>
      
      {menuOpen && (
        <Menu>
          {backgrounds.map(bg => (
            <MenuItem 
              key={bg.id} 
              onClick={() => handleBackgroundSelect(bg)}
            >
              {bg.name}
            </MenuItem>
          ))}
        </Menu>
      )}
    </div>
  );
};

export default BackgroundSwitcher; 