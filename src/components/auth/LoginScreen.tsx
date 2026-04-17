import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../ui/primitives';
import { IconLock, IconSpark, IconAlert } from '../ui/icons';

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 30px rgba(76,194,255,0.25), inset 0 0 0 1px rgba(76,194,255,0.2); }
  50%      { box-shadow: 0 0 60px rgba(76,194,255,0.45), inset 0 0 0 1px rgba(76,194,255,0.4); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Stage = styled.div`
  position: fixed;
  inset: 0;
  background: radial-gradient(1200px 600px at 50% 30%, rgba(76,194,255,0.08), transparent 60%), var(--bg-0);
  display: grid;
  place-items: center;
  padding: var(--s-5);
  overflow: hidden;
  z-index: 1;

  &:before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px) 0 0 / 100% 40px,
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px) 0 0 / 40px 100%;
    pointer-events: none;
  }
`;

const Panel = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  background: linear-gradient(180deg, var(--bg-2), var(--bg-1));
  border: 1px solid var(--border-2);
  border-radius: var(--r-xl);
  padding: var(--s-7);
  animation: ${fadeIn} 0.4s ease-out, ${pulseGlow} 4s ease-in-out infinite;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin-bottom: var(--s-6);
`;

const Logo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--accent), var(--purple));
  color: #06121d;

  svg { width: 22px; height: 22px; }
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.1;

  strong { font-size: 15px; color: var(--text-1); letter-spacing: 0.02em; }
  span { font-size: 11px; color: var(--text-3); font-family: var(--font-mono); margin-top: 4px; }
`;

const Heading = styled.h1`
  font-size: 22px;
  font-weight: 600;
  color: var(--text-1);
  letter-spacing: -0.01em;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: var(--s-2);

  svg { width: 18px; height: 18px; color: var(--accent); }
`;

const Sub = styled.p`
  font-size: 13px;
  color: var(--text-3);
  margin: 0 0 var(--s-5) 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
`;

const Mono = styled.div`
  margin-top: var(--s-5);
  padding-top: var(--s-4);
  border-top: 1px solid var(--border-1);
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--text-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  letter-spacing: 0.04em;

  .dot {
    display: inline-block;
    width: 6px; height: 6px; border-radius: 999px;
    background: var(--success);
    box-shadow: 0 0 8px var(--success);
    margin-right: 6px;
  }
`;

const ErrorBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--danger-soft);
  border: 1px solid rgba(255,93,108,0.25);
  border-radius: var(--r-sm);
  color: var(--danger);
  font-size: 12px;
  font-weight: 500;

  svg { width: 14px; height: 14px; }
`;

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(password);
    if (!ok) {
      setAttempts(a => a + 1);
      setError(`Authentication failed (${attempts + 1}/3)`);
      setPassword('');
      setTimeout(() => setError(''), 3000);
    }
  };

  useEffect(() => {
    document.title = 'Capsuna · Sign in';
  }, []);

  return (
    <Stage>
      <Panel>
        <Brand>
          <Logo><IconSpark /></Logo>
          <BrandText>
            <strong>Capsuna</strong>
            <span>control panel</span>
          </BrandText>
        </Brand>

        <Heading><IconLock /> Authenticate</Heading>
        <Sub>Enter your access key to enter the control panel.</Sub>

        <Form onSubmit={submit}>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Access key"
            autoFocus
          />
          {error && <ErrorBox><IconAlert /> {error}</ErrorBox>}
          <Button $variant="primary" type="submit" $block>Continue</Button>
        </Form>

        <Mono>
          <span><span className="dot" />SECURE LINK</span>
          <span>v1.0 · CPS-{Math.random().toString(36).slice(2, 8).toUpperCase()}</span>
        </Mono>
      </Panel>
    </Stage>
  );
};

export default LoginScreen;
