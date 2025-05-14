import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './LoginScreen.css';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [accessAttempts, setAccessAttempts] = useState(0);
  const [matrix, setMatrix] = useState<string[]>([]);
  const [glitchEffect, setGlitchEffect] = useState(false);
  const matrixRef = useRef<HTMLDivElement>(null);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trigger glitch effect
    setGlitchEffect(true);
    setTimeout(() => setGlitchEffect(false), 500);
    
    const success = login(password);
    
    if (!success) {
      setAccessAttempts(prev => prev + 1);
      setError(`ACCESS DENIED (${accessAttempts + 1}/3)`);
      setShowError(true);
      setPassword('');
      
      // Add more intense effects after multiple failed attempts
      if (accessAttempts >= 2) {
        document.body.classList.add('critical-error');
        setTimeout(() => {
          document.body.classList.remove('critical-error');
        }, 1000);
      }
      
      // Auto-hide error after 3 seconds
      setTimeout(() => {
        setShowError(false);
      }, 3000);
    }
  };

  // Retro "typing" effect for the welcome text
  const [displayText, setDisplayText] = useState('');
  const fullText = 'CAPSUNA SECURE TERMINAL v0.9.5';
  
  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        const nextChar = fullText.charAt(i);
        console.log(`Adding character: ${nextChar}, Index: ${i}`);
        setDisplayText(prev => {
          const newText = prev + nextChar;
          console.log(`New display text: ${newText}`);
          return newText;
        });
        i++;
      } else {
        console.log('Typing effect complete');
        clearInterval(typingInterval);
      }
    }, 100);
    
    return () => clearInterval(typingInterval);
  }, []);

  // Matrix effect
  useEffect(() => {
    // Create matrix rain effect
    const createRain = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*()<>[]{};:+-=~';
      const height = matrixRef.current?.clientHeight || 300;
      const rows = Math.floor(height / 12); // Rough char height
      
      const newMatrix: string[] = [];
      for (let i = 0; i < rows; i++) {
        let row = '';
        const rowLength = Math.floor(Math.random() * 40) + 5;
        for (let j = 0; j < rowLength; j++) {
          row += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        newMatrix.push(row);
      }
      setMatrix(newMatrix);
    };

    const interval = setInterval(createRain, 300);
    createRain(); // Initial call
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`login-screen ${glitchEffect ? 'glitch' : ''}`}>
      <div className="login-container">
        <div className="terminal-header">
          <div className="header-buttons">
            <span className="terminal-button"></span>
            <span className="terminal-button"></span>
            <span className="terminal-button"></span>
          </div>
          <div className="terminal-title">
            {displayText}<span className="cursor">_</span>
          </div>
        </div>
        
        <div className="terminal-screen">
          <div className="matrix-bg" ref={matrixRef}>
            {matrix.map((row, i) => (
              <div key={i} className="matrix-row" style={{ 
                animationDelay: `${Math.random() * 2}s`,
                opacity: Math.max(0.1, Math.random())
              }}>
                {row}
              </div>
            ))}
          </div>
          
          <div className="terminal-content">
            <div className="terminal-prompt">[SYSTEM]$ Authentication required</div>
            <div className="terminal-prompt">[SYSTEM]$ Enter cipher key to proceed</div>
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <div className="prompt-wrapper">
                  <span className="terminal-prompt-symbol">&gt;</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="terminal-input"
                    placeholder="ENTER ACCESS CODE"
                    autoFocus
                  />
                </div>
              </div>
              
              {showError && (
                <div className="error-message">
                  <div className="error-icon">!</div>
                  <div className="error-text">{error}</div>
                </div>
              )}
              
              <button type="submit" className="terminal-button-submit">
                AUTHENTICATE
              </button>
            </form>
            
            <div className="terminal-footer">
              <div className="status-indicator">
                <div className="indicator-dot"></div>
                <div className="indicator-text">SECURE CONNECTION</div>
              </div>
              <div className="encryption-text">RSA-4096 ENCRYPTION ACTIVE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen; 