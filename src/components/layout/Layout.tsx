import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { format } from 'date-fns';
import '98.css/dist/98.css';
import '@react95/icons/icons.css';
import { Computer3, BatWait, Awschd32402, Confcp118, Mspaint, Shell3213 } from '@react95/icons';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import StickyNote from '../notes/StickyNote';
import BackgroundSwitcher, { getBackgroundById } from './BackgroundSwitcher';
import DesktopIcons from './DesktopIcons';

const LayoutContainer = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const AppContainer = styled.div<{ backgroundImage: string }>`
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url(${props => props.backgroundImage});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-size: 16px;
`;

const Window = styled.div`
  width: 100%;
  height: 100%;
  max-width: 1200px;
  max-height: 1000px;
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
  cursor: pointer;
  position: relative;
`;

const DatePicker = styled.input`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  padding: 4px;
  border: 1px solid #999;
  background: white;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  font-size: 0.9rem;
  display: none;
  
  &.visible {
    display: block;
  }
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
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: ${props => props.className === 'active' ? '#d8e9f9' : '#d0d0d0'};
  }

  i {
    width: 16px;
    height: 16px;
    display: inline-block;
  }
`;

const LogoutButton = styled.button`
  margin-left: auto;
  font-size: 1rem;
  padding: 6px 12px;
  border: 1px solid #999;
  border-radius: 4px;
  background-color: #e0e0e0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #d0d0d0;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: auto;
  padding: 20px;
  font-size: 1.1rem;
  background-color: #f0f0f0;
`;

const StickyNoteWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const { logout } = useAuth();
  const { currentDate, setCurrentDate } = useAppContext();
  const [backgroundId, setBackgroundId] = useState('bliss');
  
  // Update current time every minute if not in test mode
  useEffect(() => {
    if (!showDatePicker) {
      const timer = setInterval(() => {
        setCurrentDate(new Date());
      }, 60000); // Update every minute
      
      return () => clearInterval(timer);
    }
  }, [showDatePicker, setCurrentDate]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const handleDateDoubleClick = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setCurrentDate(newDate);
    }
  };

  const handleBackgroundChange = (newBackgroundId: string) => {
    setBackgroundId(newBackgroundId);
    // Save the user's preference to localStorage
    localStorage.setItem('preferredBackgroundId', newBackgroundId);
  };

  // Load user's preferred background on mount
  useEffect(() => {
    const savedBackgroundId = localStorage.getItem('preferredBackgroundId');
    if (savedBackgroundId) {
      setBackgroundId(savedBackgroundId);
    }
  }, []);

  const handleDashboardClick = () => {
    setShowDashboard(!showDashboard);
    if (!showDashboard) {
      navigate('/');
    }
  };

  const handleNotesClick = () => {
    setShowNotes(!showNotes);
  };

  return (
    <LayoutContainer>
      <AppContainer backgroundImage={getBackgroundById(backgroundId)}>
        <DesktopIcons 
          onDashboardClick={handleDashboardClick}
          onNotesClick={handleNotesClick}
        />
        {showDashboard && (
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
                <button aria-label="Close" onClick={() => setShowDashboard(false)}></button>
              </div>
            </TitleBar>

            <NavBar>
              <Link to="/">
                <NavButton className={location.pathname === '/' ? 'active' : ''}>
                  <Computer3 />
                  Dashboard
                </NavButton>
              </Link>
              <Link to="/tasks">
                <NavButton className={location.pathname === '/tasks' ? 'active' : ''}>
                  <BatWait />
                  Tasks
                </NavButton>
              </Link>
              <Link to="/meetings">
                <NavButton className={location.pathname === '/meetings' ? 'active' : ''}>
                  <Awschd32402 />
                  Meetings
                </NavButton>
              </Link>
              <Link to="/reminders">
                <NavButton className={location.pathname === '/reminders' ? 'active' : ''}>
                  <Confcp118 />
                  Reminders
                </NavButton>
              </Link>
              <Link to="/journals">
                <NavButton className={location.pathname === '/journals' ? 'active' : ''}>
                  <Mspaint />
                  Journals
                </NavButton>
              </Link>
              <LogoutButton onClick={handleLogout}>
                <Shell3213 />
                Logout
              </LogoutButton>
            </NavBar>

            <MainContent>
              <ContentArea>
                {children}
              </ContentArea>
            </MainContent>

            <StatusBar>
              <div>Ready</div>
              <StatusDateTime>
                <StatusDate onDoubleClick={handleDateDoubleClick}>
                  {format(currentDate, 'EEE, MMM d, yyyy')}
                  <DatePicker
                    type="datetime-local"
                    className={showDatePicker ? 'visible' : ''}
                    value={format(currentDate, "yyyy-MM-dd'T'HH:mm")}
                    onChange={handleDateChange}
                  />
                </StatusDate>
                <StatusTime>{format(currentDate, 'h:mm a')}</StatusTime>
              </StatusDateTime>
            </StatusBar>
          </Window>
        )}
      </AppContainer>
      <StickyNoteWrapper>
        {showNotes && (
          <StickyNote onClose={() => setShowNotes(false)} />
        )}
      </StickyNoteWrapper>
      <BackgroundSwitcher onBackgroundChange={handleBackgroundChange} />
    </LayoutContainer>
  );
};

export default Layout; 