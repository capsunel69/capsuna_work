import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { format } from 'date-fns';
import '98.css/dist/98.css';

const AppContainer = styled.div`
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #008080;
  padding: 16px;
`;

const Window = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: 100%;
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const WindowContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-top: 1px solid #dfdfdf;
`;

const NavBar = styled.div`
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
`;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const currentTime = new Date();

  return (
    <AppContainer>
      <Window className="window">
        <TitleBar className="title-bar">
          <div className="title-bar-text">
            Retro Task Manager - {
              location.pathname === '/' ? 'Dashboard' :
              location.pathname === '/tasks' ? 'Tasks' :
              location.pathname === '/meetings' ? 'Meetings' :
              location.pathname === '/reminders' ? 'Reminders' : ''
            }
          </div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </TitleBar>

        <NavBar className="window-body">
          <Link to="/">
            <button className={location.pathname === '/' ? 'active' : ''}>
              Dashboard
            </button>
          </Link>
          <Link to="/tasks">
            <button className={location.pathname === '/tasks' ? 'active' : ''}>
              Tasks
            </button>
          </Link>
          <Link to="/meetings">
            <button className={location.pathname === '/meetings' ? 'active' : ''}>
              Meetings
            </button>
          </Link>
          <Link to="/reminders">
            <button className={location.pathname === '/reminders' ? 'active' : ''}>
              Reminders
            </button>
          </Link>
        </NavBar>

        <WindowContent className="window-body">
          {children}
        </WindowContent>

        <StatusBar>
          <div>Ready</div>
          <div>{format(currentTime, 'h:mm a')}</div>
        </StatusBar>
      </Window>
    </AppContainer>
  );
};

export default Layout; 