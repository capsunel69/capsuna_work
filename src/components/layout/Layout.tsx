import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { useRegisterOverlay } from '../../hooks/useOverlayStack';
import BackgroundFx from './BackgroundFx';
import ChatWidget from '../chat/ChatWidget';
import {
  IconDashboard, IconTasks, IconCalendar, IconBell, IconNote,
  IconLogout, IconChevronLeft, IconSpark, IconClock, IconBot,
  IconMenu, IconX,
} from '../ui/icons';
import { IconButton } from '../ui/primitives';

/* ── Module registry — add a new entry to expose a new section ─────────── */
type NavItem = {
  to: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }>;
};

const NAV_PRIMARY: NavItem[] = [
  { to: '/',          label: 'Overview',  icon: IconDashboard },
  { to: '/tasks',     label: 'Tasks',     icon: IconTasks },
  { to: '/meetings',  label: 'Meetings',  icon: IconCalendar },
  { to: '/reminders', label: 'Reminders', icon: IconBell },
  { to: '/notes',     label: 'Notes',     icon: IconNote },
  { to: '/agents',    label: 'Agents',    icon: IconBot },
];

/** Mobile drawer breakpoint — keep this in sync with CSS @media queries. */
const MOBILE_BP = 720;

/* ── Layout chrome ─────────────────────────────────────────────────────── */

const Shell = styled.div<{ $collapsed: boolean }>`
  display: grid;
  grid-template-columns: ${p => p.$collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)'} 1fr;
  height: 100vh;
  /* Use the dynamic viewport when supported so the URL bar collapsing on
   * mobile Safari doesn't cause the layout to overflow. */
  height: 100dvh;
  width: 100vw;
  background: var(--bg-0);
  position: relative;
  z-index: 1;
  transition: grid-template-columns 0.2s ease;

  @media (max-width: ${MOBILE_BP}px) {
    grid-template-columns: 1fr;
  }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const Sidebar = styled.aside<{ $mobileOpen: boolean }>`
  background: var(--bg-1);
  border-right: 1px solid var(--border-1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;

  @media (max-width: ${MOBILE_BP}px) {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(280px, 86vw);
    z-index: 250;
    transform: translateX(${p => p.$mobileOpen ? '0' : '-100%'});
    transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    box-shadow: ${p => p.$mobileOpen ? '0 24px 64px rgba(0,0,0,0.55)' : 'none'};
    ${p => p.$mobileOpen && `animation: ${slideIn} 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);`}
  }
`;

const Backdrop = styled.div<{ $open: boolean }>`
  display: none;

  @media (max-width: ${MOBILE_BP}px) {
    display: ${p => p.$open ? 'block' : 'none'};
    position: fixed;
    inset: 0;
    background: rgba(2, 4, 8, 0.55);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    z-index: 240;
    animation: ${fadeIn} 0.2s ease-out;
  }
`;

const Brand = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: 0 var(--s-4);
  height: var(--topbar-h);
  border-bottom: 1px solid var(--border-1);
  flex-shrink: 0;

  .logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--accent), var(--purple));
    color: #06121d;
    flex-shrink: 0;
    box-shadow: 0 0 24px var(--accent-glow);

    svg { width: 18px; height: 18px; }
  }

  .name {
    display: ${p => p.$collapsed ? 'none' : 'flex'};
    flex-direction: column;
    line-height: 1.1;
    overflow: hidden;
  }

  .name strong { font-size: 13px; font-weight: 600; color: var(--text-1); letter-spacing: 0.02em; }
  .name span { font-size: 10.5px; color: var(--text-3); font-family: var(--font-mono); margin-top: 2px; }

  .close-mobile {
    display: none;
    margin-left: auto;
  }

  @media (max-width: ${MOBILE_BP}px) {
    .name { display: flex; }
    .close-mobile { display: inline-flex; }
  }
`;

const SidebarSectionLabel = styled.div<{ $collapsed: boolean }>`
  display: ${p => p.$collapsed ? 'none' : 'block'};
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-3);
  letter-spacing: 0.08em;
  padding: var(--s-3) var(--s-5) var(--s-2);

  @media (max-width: ${MOBILE_BP}px) {
    display: block;
  }
`;

const Nav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--s-2) var(--s-2) var(--s-3);
  gap: 2px;
  overflow-y: auto;
`;

const NavLinkStyled = styled(Link)<{ $active: boolean; $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: ${p => p.$collapsed ? '10px' : '8px 12px'};
  margin: 0 var(--s-2);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-weight: 500;
  color: ${p => p.$active ? 'var(--text-1)' : 'var(--text-2)'};
  background: ${p => p.$active ? 'var(--bg-3)' : 'transparent'};
  text-decoration: none;
  position: relative;
  transition: background 0.15s, color 0.15s;
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-start'};

  &:hover { color: var(--text-1); background: var(--bg-3); }

  ${p => p.$active && `
    &:before {
      content: '';
      position: absolute;
      left: -10px;
      top: 6px;
      bottom: 6px;
      width: 3px;
      border-radius: 2px;
      background: var(--accent);
      box-shadow: 0 0 12px var(--accent-glow);
    }
  `}

  svg { width: 18px; height: 18px; flex-shrink: 0; }
  .label { display: ${p => p.$collapsed ? 'none' : 'inline'}; }

  @media (max-width: ${MOBILE_BP}px) {
    padding: 12px 14px;
    font-size: 14px;
    min-height: 44px;
    .label { display: inline; }
  }
`;

const SidebarFooter = styled.div`
  padding: var(--s-3);
  border-top: 1px solid var(--border-1);
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const FooterButton = styled.button<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: ${p => p.$collapsed ? '10px' : '8px 12px'};
  border-radius: var(--r-sm);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  justify-content: ${p => p.$collapsed ? 'center' : 'flex-start'};
  transition: background 0.15s, color 0.15s;

  &:hover { background: var(--bg-3); color: var(--text-1); }

  svg { width: 18px; height: 18px; flex-shrink: 0; }
  .label { display: ${p => p.$collapsed ? 'none' : 'inline'}; }

  @media (max-width: ${MOBILE_BP}px) {
    padding: 12px 14px;
    font-size: 14px;
    min-height: 44px;
    justify-content: flex-start;
    .label { display: inline; }
  }
`;

/* ── Topbar / content ──────────────────────────────────────────────────── */

const Main = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
`;

const Topbar = styled.header`
  height: var(--topbar-h);
  border-bottom: 1px solid var(--border-1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--s-5);
  background: rgba(7, 9, 13, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  flex-shrink: 0;
  gap: var(--s-3);

  @media (max-width: ${MOBILE_BP}px) {
    padding: 0 var(--s-3);
    gap: var(--s-2);
  }
`;

const TopbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-width: 0;
`;

const SidebarToggle = styled(IconButton)`
  /** Hide the desktop chevron on mobile — we render a hamburger instead. */
  @media (max-width: ${MOBILE_BP}px) {
    display: none;
  }
`;

const HamburgerToggle = styled(IconButton)`
  display: none;

  @media (max-width: ${MOBILE_BP}px) {
    display: inline-flex;
  }
`;

const Crumbs = styled.div`
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-size: 12px;
  color: var(--text-3);
  min-width: 0;

  .prefix,
  .sep { color: var(--text-4); }
  .here { color: var(--text-1); font-weight: 500; }

  @media (max-width: ${MOBILE_BP}px) {
    font-size: 13px;
    .prefix,
    .sep { display: none; }
    .here {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.005em;
    }
  }
`;

const TopbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: var(--s-3);
  flex-shrink: 0;

  @media (max-width: ${MOBILE_BP}px) {
    gap: var(--s-2);
  }
`;

const StatusPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--bg-2);
  border: 1px solid var(--border-1);
  font-size: 11px;
  color: var(--text-2);
  font-family: var(--font-mono);

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--success);
    box-shadow: 0 0 8px var(--success);
  }

  @media (max-width: ${MOBILE_BP}px) {
    display: none;
  }
`;

const Clock = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  svg { width: 14px; height: 14px; color: var(--text-3); flex-shrink: 0; }

  .day { color: var(--text-2); }
  .sep { color: var(--text-3); }
  .time { color: var(--text-1); font-weight: 500; }

  @media (max-width: ${MOBILE_BP}px) {
    gap: 4px;
    font-size: 12.5px;

    svg { display: none; }
    .day,
    .sep { display: none; }
  }
`;

const Content = styled.main`
  flex: 1;
  overflow: auto;
  position: relative;
  isolation: isolate;
  -webkit-overflow-scrolling: touch;
`;

const ContentInner = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--s-6) var(--s-6);

  @media (max-width: ${MOBILE_BP}px) {
    padding: var(--s-3);
    /* Leave room for the floating chat bubble. */
    padding-bottom: calc(var(--s-3) + 80px);
  }
`;

const StickyLayer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: none;
  > * { pointer-events: auto; }
`;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { currentDate, setCurrentDate } = useAppContext();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebarCollapsed') === '1';
  });
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Register the mobile drawer in the global overlay stack so the chat
  // bubble auto-hides while it's open.
  useRegisterOverlay(mobileNavOpen);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    const t = setInterval(() => setCurrentDate(new Date()), 30_000);
    return () => clearInterval(t);
  }, [setCurrentDate]);

  // Close drawer on route change so users don't see it linger after a tap.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the drawer is open (prevents background scroll
  // on iOS / Android when the drawer is taller than the viewport).
  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  // Close the drawer on Esc.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  // Auto-close the drawer if the viewport grows past the breakpoint.
  useEffect(() => {
    if (typeof window === 'undefined' || !mobileNavOpen) return;
    const onResize = (): void => {
      if (window.innerWidth > MOBILE_BP) setMobileNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobileNavOpen]);

  const currentLabel = useMemo(() => {
    const match = NAV_PRIMARY.find(n => n.to === location.pathname);
    return match?.label ?? 'Overview';
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${currentLabel} · Capsuna`;
  }, [currentLabel]);

  const handleLogout = useCallback(() => {
    if (window.confirm('Sign out of the control panel?')) logout();
  }, [logout]);

  return (
    <Shell $collapsed={collapsed}>
      <Backdrop
        $open={mobileNavOpen}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
      <Sidebar
        $mobileOpen={mobileNavOpen}
        aria-label="Primary navigation"
      >
        <Brand $collapsed={collapsed}>
          <div className="logo"><IconSpark /></div>
          <div className="name">
            <strong>Capsuna</strong>
            <span>control panel</span>
          </div>
          <IconButton
            className="close-mobile"
            $variant="ghost"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <IconX />
          </IconButton>
        </Brand>

        <SidebarSectionLabel $collapsed={collapsed}>Workspace</SidebarSectionLabel>
        <Nav>
          {NAV_PRIMARY.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <NavLinkStyled
                key={item.to}
                to={item.to}
                $active={active}
                $collapsed={collapsed}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileNavOpen(false)}
              >
                <Icon />
                <span className="label">{item.label}</span>
              </NavLinkStyled>
            );
          })}
        </Nav>

        <SidebarFooter>
          <FooterButton
            $collapsed={collapsed}
            onClick={handleLogout}
            title={collapsed ? 'Sign out' : undefined}
          >
            <IconLogout /> <span className="label">Sign out</span>
          </FooterButton>
        </SidebarFooter>
      </Sidebar>

      <Main>
        <Topbar>
          <TopbarLeft>
            <HamburgerToggle
              $variant="ghost"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
            >
              <IconMenu />
            </HamburgerToggle>
            <SidebarToggle
              $variant="ghost"
              onClick={() => setCollapsed(c => !c)}
              aria-label="Toggle sidebar"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
            >
              <IconChevronLeft />
            </SidebarToggle>
            <Crumbs>
              <span className="prefix">Workspace</span>
              <span className="sep">/</span>
              <span className="here">{currentLabel}</span>
            </Crumbs>
          </TopbarLeft>
          <TopbarRight>
            <StatusPill>
              <span className="dot" />
              <span>SYSTEMS NOMINAL</span>
            </StatusPill>
            <Clock>
              <IconClock />
              <span className="day">{format(currentDate, 'EEE, MMM d')}</span>
              <span className="sep">·</span>
              <span className="time">{format(currentDate, 'HH:mm')}</span>
            </Clock>
          </TopbarRight>
        </Topbar>

        <Content>
          <BackgroundFx />
          <ContentInner>{children}</ContentInner>
        </Content>
      </Main>

      <StickyLayer>
        <ChatWidget />
      </StickyLayer>
    </Shell>
  );
};

export default Layout;
