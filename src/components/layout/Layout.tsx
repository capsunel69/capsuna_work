import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { format } from 'date-fns';
import '98.css/dist/98.css';
import '@react95/icons/icons.css';
import { Computer3, BatWait, Awschd32402, Confcp118, Shell3213 } from '@react95/icons';
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
`;

const Window = styled.div`
  width: 95%;
  height: 90%;
  max-width: 1200px;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  background: #ececec;
  border-radius: 8px;
  overflow: hidden;
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: linear-gradient(180deg, #0a246a, #0d47a1);
  color: white;
`;

const TitleText = styled.span`
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WindowControls = styled.div`
  display: flex;
  gap: 4px;
`;

const WindowButton = styled.button`
  width: 22px;
  height: 22px;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 3px;
  background: rgba(255,255,255,0.1);
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255,255,255,0.2);
  }
`;

const NavBar = styled.div`
  display: flex;
  gap: 2px;
  padding: 8px 10px;
  background: linear-gradient(180deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #dee2e6;
`;

const NavLink = styled(Link)`
  text-decoration: none;
`;

const NavButton = styled.button<{ $active?: boolean }>`
  font-size: 13px;
  padding: 8px 16px;
  font-weight: ${props => props.$active ? '600' : '500'};
  background: ${props => props.$active ? '#fff' : 'transparent'};
  border: 1px solid ${props => props.$active ? '#dee2e6' : 'transparent'};
  border-bottom: ${props => props.$active ? '1px solid #fff' : '1px solid transparent'};
  border-radius: 4px 4px 0 0;
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.$active ? '#0a246a' : '#495057'};
  transition: all 0.15s;
  
  &:hover {
    background: ${props => props.$active ? '#fff' : 'rgba(0,0,0,0.05)'};
    color: #0a246a;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const LogoutButton = styled.button`
  margin-left: auto;
  font-size: 13px;
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  font-weight: 500;
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &:hover {
    background: rgba(220,53,69,0.1);
    color: #dc3545;
    border-color: rgba(220,53,69,0.2);
  }
`;

const MainContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: auto;
  padding: 12px 15px;
  background: #f5f5f5;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: linear-gradient(180deg, #f0f0f0, #e0e0e0);
  border-top: 1px solid #ccc;
  font-size: 12px;
  color: #555;
`;

const StatusLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusIndicator = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:before {
    content: '';
    width: 8px;
    height: 8px;
    background: #28a745;
    border-radius: 50%;
  }
`;

const StatusDateTime = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const StatusDate = styled.div`
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 3px;
  position: relative;
  
  &:hover {
    background: rgba(0,0,0,0.05);
  }
`;

const DatePicker = styled.input`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-size: 13px;
  display: none;
  
  &.visible {
    display: block;
  }
`;

const StatusTime = styled.div`
  font-weight: 600;
  color: #333;
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

  useEffect(() => {
    if (!showDatePicker) {
      const timer = setInterval(() => {
        setCurrentDate(new Date());
      }, 60000);
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
    localStorage.setItem('preferredBackgroundId', newBackgroundId);
  };

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

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/tasks': return 'Tasks';
      case '/meetings': return 'Meetings';
      case '/reminders': return 'Reminders';
      default: return 'Dashboard';
    }
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
            <TitleBar>
              <TitleText>
                📋 Retro Task Manager - {getPageTitle()}
              </TitleText>
              <WindowControls>
                <WindowButton onClick={() => setShowDashboard(false)}>─</WindowButton>
                <WindowButton>□</WindowButton>
                <WindowButton onClick={() => setShowDashboard(false)}>✕</WindowButton>
              </WindowControls>
            </TitleBar>

            <NavBar>
              <NavLink to="/">
                <NavButton $active={location.pathname === '/'}>
                  <Computer3 />
                  Dashboard
                </NavButton>
              </NavLink>
              <NavLink to="/tasks">
                <NavButton $active={location.pathname === '/tasks'}>
                  <BatWait />
                  Tasks
                </NavButton>
              </NavLink>
              <NavLink to="/meetings">
                <NavButton $active={location.pathname === '/meetings'}>
                  <Awschd32402 />
                  Meetings
                </NavButton>
              </NavLink>
              <NavLink to="/reminders">
                <NavButton $active={location.pathname === '/reminders'}>
                  <Confcp118 />
                  Reminders
                </NavButton>
              </NavLink>
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
              <StatusLeft>
                <StatusIndicator>Ready</StatusIndicator>
              </StatusLeft>
              <StatusDateTime>
                <StatusDate onDoubleClick={handleDateDoubleClick}>
                  📅 {format(currentDate, 'EEE, MMM d, yyyy')}
                  <DatePicker
                    type="datetime-local"
                    className={showDatePicker ? 'visible' : ''}
                    value={format(currentDate, "yyyy-MM-dd'T'HH:mm")}
                    onChange={handleDateChange}
                  />
                </StatusDate>
                <StatusTime>🕐 {format(currentDate, 'h:mm a')}</StatusTime>
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
