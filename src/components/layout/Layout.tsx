import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { format } from 'date-fns';
import '98.css/dist/98.css';
import blissBackground from '../../assets/bliss-update.jpg';

const AppContainer = styled.div`
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url(${blissBackground});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-size: 16px;
`;

const Window = styled.div`
  width: 85%;
  height: 85%;
  max-width: 1200px;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  overflow: hidden;
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1rem;
  padding: 6px 10px;
`;

const WindowContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 20px;
  font-size: 1.1rem;
  background-color: #f0f0f0;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  border-top: 1px solid #dfdfdf;
  font-size: 1rem;
`;

const StatusDateTime = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusDate = styled.div`
  border-right: 1px solid #ccc;
  padding-right: 16px;
`;

const StatusTime = styled.div`
`;

const NavBar = styled.div`
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  padding: 10px;
  background-color: #ececec;
  border-bottom: 1px solid #dfdfdf;
`;

const NavButton = styled.button`
  font-size: 1.1rem;
  padding: 8px 15px;
  font-weight: ${props => props.className === 'active' ? 'bold' : 'normal'};
  background-color: ${props => props.className === 'active' ? '#d8e9f9' : '#e0e0e0'};
  border: 1px solid #999;
  border-radius: 4px;
  box-shadow: ${props => props.className === 'active' ? 'inset 0 0 3px rgba(0, 0, 0, 0.2)' : '0 1px 2px rgba(0, 0, 0, 0.1)'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.className === 'active' ? '#d8e9f9' : '#d0d0d0'};
  }
`;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  return (
    <AppContainer>
      <Window className="window">
        <TitleBar className="title-bar">
          <div className="title-bar-text">
            Retro Task Manager - {
              location.pathname === '/' ? 'Dashboard' :
              location.pathname === '/tasks' ? 'Tasks' :
              location.pathname === '/meetings' ? 'Meetings' :
              location.pathname === '/reminders' ? 'Reminders' :
              location.pathname === '/journals' ? 'Journals' : ''
            }
          </div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </TitleBar>

        <NavBar>
          <Link to="/">
            <NavButton className={location.pathname === '/' ? 'active' : ''}>
              Dashboard
            </NavButton>
          </Link>
          <Link to="/tasks">
            <NavButton className={location.pathname === '/tasks' ? 'active' : ''}>
              Tasks
            </NavButton>
          </Link>
          <Link to="/meetings">
            <NavButton className={location.pathname === '/meetings' ? 'active' : ''}>
              Meetings
            </NavButton>
          </Link>
          <Link to="/reminders">
            <NavButton className={location.pathname === '/reminders' ? 'active' : ''}>
              Reminders
            </NavButton>
          </Link>
          <Link to="/journals">
            <NavButton className={location.pathname === '/journals' ? 'active' : ''}>
              Journals
            </NavButton>
          </Link>
        </NavBar>

        <WindowContent>
          {children}
        </WindowContent>

        <StatusBar>
          <div>Ready</div>
          <StatusDateTime>
            <StatusDate>{format(currentDateTime, 'EEE, MMM d, yyyy')}</StatusDate>
            <StatusTime>{format(currentDateTime, 'h:mm a')}</StatusTime>
          </StatusDateTime>
        </StatusBar>
      </Window>
    </AppContainer>
  );
};

export default Layout; 