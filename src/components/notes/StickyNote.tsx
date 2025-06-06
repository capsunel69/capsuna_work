import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';

// Modal overlay with darkened background
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const StickyNoteContainer = styled.div<{ width: number; height: number }>`
  position: relative;
  width: ${props => props.width}px;
  min-width: 300px;
  max-width: 90vw;
  height: ${props => props.height}px;
  min-height: 400px;
  max-height: 80vh;
  background: #ffd700;
  padding: 0;
  box-shadow: 
    2px 2px 10px rgba(0, 0, 0, 0.2),
    0 0 40px rgba(0, 0, 0, 0.1);
  font-family: 'Share Tech Mono', monospace;
  display: flex;
  flex-direction: column;
  transform-origin: center center;
  resize: both;
  overflow: hidden;
  
  &:active {
    box-shadow: 
      4px 4px 15px rgba(0, 0, 0, 0.3),
      0 0 40px rgba(0, 0, 0, 0.1);
  }
`;

const DragHandle = styled.div`
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;

  &:before {
    content: '● ● ●';
    position: absolute;
    left: 10px;
    top: 5px;
    color: rgba(0, 0, 0, 0.3);
    font-size: 12px;
  }
`;

const NoteContentWrapper = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 10px;
  height: calc(100% - 30px);
  overflow: auto;
`;

const NoteContent = styled.div`
  flex: 1;
  font-size: 1rem;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.4;
  margin-top: 10px;
  margin-bottom: 10px;
  cursor: text;
  user-select: text;
  overflow-y: auto;
  
  a {
    color: #0000EE;
    text-decoration: underline;
    cursor: pointer;
    
    &:hover {
      color: #551A8B;
    }
    
    &:visited {
      color: #551A8B;
    }
  }
`;

const NoteTextArea = styled.textarea`
  width: 100%;
  flex: 1;
  min-height: 200px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.2);
  padding: 8px;
  font-family: inherit;
  font-size: 1rem;
  resize: none;
  margin-bottom: 10px;
  line-height: 1.4;
  cursor: text;
  
  &:focus {
    outline: none;
    border-color: rgba(0, 0, 0, 0.4);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const SaveButton = styled.button`
  padding: 6px 12px;
  background: linear-gradient(to bottom, #4f94ea, #3a7bd5);
  color: white;
  border: 1px solid #2c5ea9;
  border-radius: 3px;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  
  &:hover {
    background: linear-gradient(to bottom, #5ca0ff, #4485e6);
  }
  
  &:active {
    background: #3a7bd5;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
  }
`;

const EditButton = styled.button`
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  z-index: 1;
  
  &:hover {
    background: rgba(255, 255, 255, 0.6);
  }
`;

const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 15px;
  height: 15px;
  cursor: nwse-resize;
  background: rgba(0, 0, 0, 0.05);
  z-index: 10;
  
  &:before {
    content: '';
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 5px;
    height: 5px;
    border-right: 2px solid rgba(0, 0, 0, 0.3);
    border-bottom: 2px solid rgba(0, 0, 0, 0.3);
  }
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  color: #000;
  font-size: 16px;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  z-index: 10;
  
  &:hover {
    background-color: #ff0000;
    color: white;
  }
`;

interface Note {
  id: string;
  content: string;
  updatedAt: Date;
}

interface Size {
  width: number;
  height: number;
}

interface StickyNoteProps {
  onClose: () => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({ onClose }) => {
  const [note, setNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [size, setSize] = useState<Size>({ width: 600, height: 700 });
  const [isResizing, setIsResizing] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Function to convert URLs to clickable links
  const convertLinksToHtml = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  };

  // Fetch note - only once on component mount
  const fetchNote = useCallback(async () => {
    try {
      const response = await fetch('/.netlify/functions/notes');
      const data = await response.json();
      if (data && data.id) {
        setNote(data);
        setContent(data.content || '');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    }
  }, []);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  // Handle clicking on overlay to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (nodeRef.current) {
      setIsResizing(true);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height
      };
      
      // Add document-level event listeners
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
  };
  
  // Handle resize move
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (isResizing && resizeStartRef.current) {
      const start = resizeStartRef.current;
      const newWidth = Math.max(250, start.width + (e.clientX - start.x));
      const newHeight = Math.max(200, start.height + (e.clientY - start.y));
      setSize({ width: newWidth, height: newHeight });
    }
  }, [isResizing]);
  
  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeStartRef.current = null;
    
    // Remove document-level event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  // Save note
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const noteData = {
        id: note?.id || uuidv4(),
        content,
        updatedAt: new Date()
      };

      const response = await fetch('/.netlify/functions/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        const savedNote = await response.json();
        setNote(savedNote);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Prevent text selection propagation
  const handleContentMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle clicking on note content to enter edit mode
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Don't enter edit mode if clicking on a link
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'a') {
      return;
    }
    
    // Enter edit mode when clicking on the text content
    setIsEditing(true);
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <StickyNoteContainer ref={nodeRef} width={size.width} height={size.height}>
        <DragHandle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </DragHandle>
        <NoteContentWrapper>
          {isEditing ? (
            <>
              <NoteTextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your note here..."
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onMouseDown={handleContentMouseDown}
              />
              <SaveButton onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Note'}
              </SaveButton>
            </>
          ) : (
            <>
              <NoteContent
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(convertLinksToHtml(note?.content || ''))
                }}
                onClick={handleContentClick}
                onMouseDown={handleContentMouseDown}
              />
              <ButtonContainer>
                <EditButton 
                  onClick={() => setIsEditing(true)}
                  onMouseDown={handleContentMouseDown}
                >
                  Edit Note
                </EditButton>
              </ButtonContainer>
            </>
          )}
        </NoteContentWrapper>
        <ResizeHandle 
          onMouseDown={handleResizeStart}
          onClick={(e) => e.stopPropagation()}
        />
      </StickyNoteContainer>
    </ModalOverlay>
  );
};

export default StickyNote; 