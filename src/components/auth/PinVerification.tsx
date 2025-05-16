import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
`;

const scanline = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
`;

const accessGranted = keyframes`
  0% { color: #00ff00; }
  50% { color: #004400; }
  100% { color: #00ff00; }
`;

const accessDenied = keyframes`
  0% { color: #ff0000; }
  50% { color: #440000; }
  100% { color: #ff0000; }
`;

const PinContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background: #c0c0c0;
  animation: ${fadeIn} 0.5s ease-out;
  position: relative;
  overflow: hidden;
`;

const Scanline = styled.div`
  position: absolute;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  animation: ${scanline} 4s linear infinite;
  pointer-events: none;
`;

const AccessMessage = styled.div<{ status: 'granted' | 'denied' | null }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
  font-size: 48px;
  font-weight: bold;
  background: rgba(0, 0, 0, 0.8);
  animation: ${props => props.status === 'granted' ? accessGranted : accessDenied} 1s ease-in-out infinite;
  z-index: 100;
`;

const PinBox = styled.div`
  background: #dfdfdf;
  padding: 20px;
  border: 2px solid #999;
  box-shadow: inset 1px 1px 0px white, inset -1px -1px 0px #adadad;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  min-width: 320px;
  max-height: 90%;
`;

const PinHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  animation: ${fadeIn} 0.5s ease-out;
`;

const LockIcon = styled.div`
  width: 24px;
  height: 24px;
  background: #000;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z'/%3E%3C/svg%3E") center/contain no-repeat;
  margin-right: 8px;
`;

const PinTitle = styled.h2`
  font-family: 'MS Sans Serif', sans-serif;
  color: #000;
  text-align: center;
  margin: 0;
  font-size: 1.2rem;
`;

const PinInputContainer = styled.div<{ error: boolean }>`
  display: flex;
  gap: 8px;
  margin: 20px 0;
  animation: ${props => props.error ? shake : 'none'} 0.5s ease-in-out;
`;

const PinDigit = styled.input`
  width: 35px;
  height: 35px;
  font-family: 'MS Sans Serif', sans-serif;
  font-size: 20px;
  text-align: center;
  background: white;
  border: 2px inset #dfdfdf;
  margin: 0;
  padding: 0;
  &:focus {
    outline: none;
    border-color: #0078d7;
  }
`;

const ErrorMessage = styled.div`
  color: #ff0000;
  font-family: 'MS Sans Serif', sans-serif;
  margin-top: 10px;
  text-align: center;
  animation: ${fadeIn} 0.3s ease-out;
`;

const NumPad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 10px;
  padding: 8px;
  background: #c0c0c0;
  border: 2px solid #999;
`;

const NumButton = styled.button`
  width: 45px;
  height: 45px;
  font-family: 'MS Sans Serif', sans-serif;
  font-size: 18px;
  background: #dfdfdf;
  border: 2px outset #fff;
  cursor: pointer;
  transition: all 0.1s;

  &:active {
    border-style: inset;
    transform: scale(0.95);
  }

  &:hover {
    background: #e8e8e8;
  }
`;

const EnterPrompt = styled.div<{ active: boolean }>`
  font-family: 'MS Sans Serif', sans-serif;
  color: ${props => props.active ? '#008800' : '#666'};
  margin-top: 10px;
  text-align: center;
  font-size: 0.9rem;
`;

interface PinVerificationProps {
  correctPin: string;
  onSuccess: () => void;
}

const PinVerification: React.FC<PinVerificationProps> = ({ correctPin, onSuccess }) => {
  const [digits, setDigits] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [accessStatus, setAccessStatus] = useState<'granted' | 'denied' | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError('');

    // Move to next input if value was entered
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleNumPadClick = (num: string) => {
    const emptyIndex = digits.findIndex(d => d === '');
    if (emptyIndex !== -1) {
      handleDigitChange(emptyIndex, num);
    }
  };

  const handleContainerKeyPress = (e: KeyboardEvent) => {
    if (/^\d$/.test(e.key)) {
      const emptyIndex = digits.findIndex(d => d === '');
      if (emptyIndex !== -1) {
        handleDigitChange(emptyIndex, e.key);
      }
    }
  };

  const verifyPin = () => {
    const enteredPin = digits.join('');
    if (enteredPin.length === 5) {
      if (enteredPin === correctPin) {
        setAccessStatus('granted');
        setTimeout(() => {
          setAccessStatus(null);
          onSuccess();
        }, 2000);
      } else {
        setAccessStatus('denied');
        setTimeout(() => {
          setAccessStatus(null);
          setDigits(['', '', '', '', '']);
          setError('Access Denied');
          inputRefs.current[0]?.focus();
        }, 2000);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      verifyPin();
    } else if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    const container = containerRef.current;
    if (container) {
      container.focus();
      container.addEventListener('keypress', handleContainerKeyPress);
    }

    return () => {
      if (container) {
        container.removeEventListener('keypress', handleContainerKeyPress);
      }
    };
  }, [digits]);

  const allDigitsFilled = digits.every(d => d !== '');

  return (
    <PinContainer 
      ref={containerRef} 
      tabIndex={0}
      onFocus={() => {
        const emptyIndex = digits.findIndex(d => d === '');
        const indexToFocus = emptyIndex === -1 ? 0 : emptyIndex;
        inputRefs.current[indexToFocus]?.focus();
      }}
    >
      <Scanline />
      {accessStatus && (
        <AccessMessage status={accessStatus}>
          ACCESS {accessStatus === 'granted' ? 'GRANTED' : 'DENIED'}
        </AccessMessage>
      )}
      <PinBox>
        <PinHeader>
          <LockIcon />
          <PinTitle>Enter PIN to Access Journal</PinTitle>
        </PinHeader>

        <PinInputContainer error={!!error}>
          {digits.map((digit, index) => (
            <PinDigit
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="password"
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => handleKeyDown(e, index)}
              maxLength={1}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          ))}
        </PinInputContainer>

        <EnterPrompt active={allDigitsFilled}>
          Press ENTER to verify
        </EnterPrompt>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <NumPad>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <NumButton key={num} onClick={() => handleNumPadClick(num.toString())}>
              {num}
            </NumButton>
          ))}
          <NumButton onClick={() => setDigits(['', '', '', '', ''])}>C</NumButton>
          <NumButton onClick={() => handleNumPadClick('0')}>0</NumButton>
          <NumButton onClick={() => {
            const lastFilledIndex = digits.findIndex(d => d === '') - 1;
            if (lastFilledIndex >= 0) {
              const newDigits = [...digits];
              newDigits[lastFilledIndex] = '';
              setDigits(newDigits);
              inputRefs.current[lastFilledIndex]?.focus();
            }
          }}>←</NumButton>
        </NumPad>
      </PinBox>
    </PinContainer>
  );
};

export default PinVerification; 