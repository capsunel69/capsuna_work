import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';
import { ModalOverlay, IconButton, Button, Spinner } from '../ui/primitives';
import { IconX, IconEdit, IconNote, IconCheck } from '../ui/icons';

const Container = styled.div<{ $w: number; $h: number }>`
  position: relative;
  width: ${p => p.$w}px;
  height: ${p => p.$h}px;
  min-width: 320px;
  min-height: 320px;
  max-width: 92vw;
  max-height: 86vh;
  background: var(--bg-2);
  border: 1px solid var(--border-2);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--s-3) var(--s-4);
  border-bottom: 1px solid var(--border-1);

  .title {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-1);
  }

  .title svg { width: 16px; height: 16px; color: var(--accent); }
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--s-4);
  gap: var(--s-3);
  overflow: hidden;
`;

const Display = styled.div`
  flex: 1;
  overflow: auto;
  background: var(--bg-1);
  border: 1px solid var(--border-1);
  border-radius: var(--r-sm);
  padding: var(--s-4);
  font-size: 14px;
  color: var(--text-1);
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  cursor: text;

  a {
    color: var(--accent);
    text-decoration: underline;
  }
  a:hover { color: var(--accent-strong); }

  &:empty:before {
    content: 'No content yet — click to start writing.';
    color: var(--text-3);
    font-style: italic;
  }
`;

const TextArea = styled.textarea`
  flex: 1;
  width: 100%;
  background: var(--bg-1);
  border: 1px solid var(--border-2);
  border-radius: var(--r-sm);
  padding: var(--s-4);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-1);
  resize: none;
  line-height: 1.6;

  &:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--s-2);
`;

const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;

  &:before {
    content: '';
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 8px;
    height: 8px;
    border-right: 2px solid var(--text-4);
    border-bottom: 2px solid var(--text-4);
    border-radius: 1px;
  }

  &:hover:before { border-color: var(--text-2); }
`;

interface Note {
  id: string;
  content: string;
  updatedAt: Date;
}

interface Props {
  onClose: () => void;
}

const linkify = (text: string) => {
  const re = /(https?:\/\/[^\s]+)/g;
  return text.replace(re, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
};

const StickyNote: React.FC<Props> = ({ onClose }) => {
  const [note, setNote] = useState<Note | null>(null);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState({ w: 600, h: 600 });
  const startRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/.netlify/functions/notes');
        const d = await r.json();
        if (d?.id) { setNote(d); setContent(d.content || ''); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    try {
      const data = { id: note?.id || uuidv4(), content, updatedAt: new Date() };
      const r = await fetch('/.netlify/functions/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (r.ok) {
        const saved = await r.json();
        setNote(saved);
        setEditing(false);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const onMove = useCallback((e: MouseEvent) => {
    if (!startRef.current) return;
    const s = startRef.current;
    setSize({ w: Math.max(320, s.w + (e.clientX - s.x)), h: Math.max(320, s.h + (e.clientY - s.y)) });
  }, []);
  const onUp = useCallback(() => {
    startRef.current = null;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }, [onMove]);
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    startRef.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Container $w={size.w} $h={size.h} onClick={e => e.stopPropagation()}>
        <Header>
          <span className="title"><IconNote /> Notes</span>
          <IconButton $variant="ghost" $size="sm" onClick={onClose}><IconX /></IconButton>
        </Header>
        <Body>
          {loading ? (
            <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}><Spinner $size={24} /></div>
          ) : editing ? (
            <>
              <TextArea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Type freely. Markdown-friendly URLs become links."
                autoFocus
              />
              <Footer>
                <Button $variant="ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                <Button $variant="primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : <><IconCheck /> Save</>}
                </Button>
              </Footer>
            </>
          ) : (
            <>
              <Display
                onClick={(e) => {
                  const t = e.target as HTMLElement;
                  if (t.tagName.toLowerCase() === 'a') return;
                  setEditing(true);
                }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(linkify(note?.content || '')) }}
              />
              <Footer>
                <Button $variant="secondary" onClick={() => setEditing(true)}><IconEdit /> Edit</Button>
              </Footer>
            </>
          )}
        </Body>
        <ResizeHandle onMouseDown={startResize} />
      </Container>
    </ModalOverlay>
  );
};

export default StickyNote;
