import React from 'react';
import styled from 'styled-components';

const Link = styled.a`
  color: #2563eb;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

interface LinkifyTextProps {
  text: string;
}

const LinkifyText: React.FC<LinkifyTextProps> = ({ text }) => {
  // URL regex pattern that matches http, https, and www URLs
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  
  // Split text into parts with URLs and non-URLs
  const parts = text.split(urlPattern);
  
  return (
    <span>
      {parts.map((part, i) => {
        if (!part) return null;
        
        // Check if this part is a URL
        if (urlPattern.test(part)) {
          const href = part.startsWith('www.') ? `https://${part}` : part;
          return (
            <Link 
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {part}
            </Link>
          );
        }
        
        return part;
      })}
    </span>
  );
};

export default LinkifyText; 