import React, { useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Spinner } from '../ui/primitives';

/**
 * Coerce DB content into HTML TipTap can load. Old rows may be plain text.
 */
export function toEditorHtml(raw: string): string {
  if (!raw || !raw.trim()) return '<p></p>';
  const t = raw.trim();
  if (/<[a-z][\s\S]*>/i.test(t) && (t.includes('</p>') || t.includes('<p>') || t.includes('<h') || t.includes('<ul') || t.includes('<a ') || t.includes('<ol'))) {
    return raw;
  }
  const lines = raw.split('\n');
  const escaped = lines
    .map((line) =>
      line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;'),
    )
    .join('<br>');
  return `<p>${escaped || '<br>'}</p>`;
}

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 0 0 10px;
  border-bottom: 1px solid var(--border-1);
  margin-bottom: 10px;
`;

const TBtn = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid ${(p) => (p.$active ? 'var(--accent)' : 'var(--border-1)')};
  border-radius: var(--r-sm);
  background: ${(p) => (p.$active ? 'var(--accent-soft)' : 'var(--bg-2)')};
  color: var(--text-1);
  font-size: 12px;
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;

  &:hover:not(:disabled) {
    border-color: var(--border-3);
    background: var(--bg-3);
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const TLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: var(--text-1);
  font-family: var(--font-sans, system-ui);
`;

const Sep = styled.div`
  width: 1px;
  height: 20px;
  background: var(--border-1);
  margin: 0 4px;
`;

const EditorShell = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-2);
  border-radius: var(--r-sm);
  background: var(--bg-0);
  padding: 10px 12px;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  .ProseMirror {
    min-height: 220px;
    max-height: min(60vh, 640px);
    overflow-y: auto;
    outline: none;
    font-size: 14px;
    line-height: 1.65;
    color: var(--text-1);
  }

  .ProseMirror p {
    margin: 0 0 0.65em;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    color: var(--text-3);
  }
  .ProseMirror h2, .ProseMirror h3 {
    margin: 0.9em 0 0.4em;
    font-weight: 600;
    line-height: 1.25;
  }
  .ProseMirror h2 { font-size: 1.2em; }
  .ProseMirror h3 { font-size: 1.08em; }
  .ProseMirror ul, .ProseMirror ol {
    margin: 0 0 0.65em 1.1em;
    padding-left: 0.2em;
  }
  .ProseMirror li { margin-bottom: 0.25em; }
  .ProseMirror a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .ProseMirror a:hover { color: var(--accent-strong, var(--accent)); }
  .ProseMirror u { text-underline-offset: 2px; }
  .ProseMirror blockquote {
    margin: 0.5em 0 0.65em;
    padding-left: 0.9em;
    border-left: 3px solid var(--accent);
    color: var(--text-2);
  }
  .ProseMirror pre {
    background: var(--bg-2);
    border: 1px solid var(--border-1);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 12.5px;
    overflow-x: auto;
    margin: 0.5em 0;
  }
  .ProseMirror code {
    font-family: var(--font-mono);
    font-size: 0.92em;
    background: var(--bg-2);
    padding: 1px 5px;
    border-radius: 4px;
  }
  .ProseMirror hr {
    border: 0;
    border-top: 1px solid var(--border-1);
    margin: 1em 0;
  }
`;

interface NotesRichEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
}

const NotesRichEditor: React.FC<NotesRichEditorProps> = ({ initialHtml, onChange }) => {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Placeholder.configure({
        placeholder: 'Start writing — use the toolbar for bold, lists, and links…',
      }),
    ],
    content: toEditorHtml(initialHtml),
    onUpdate: ({ editor: e }) => {
      onChangeRef.current(e.getHTML());
    },
  });

  const linkClick = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const next = window.prompt(
      'Link URL (empty = remove link)',
      previousUrl ?? 'https://',
    );
    if (next === null) return;
    if (next === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const url = /^https?:\/\//i.test(next) ? next : `https://${next.replace(/^\/+/, '')}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <EditorShell style={{ minHeight: 200, display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
        <Spinner $size={28} />
      </EditorShell>
    );
  }

  return (
    <div>
      <Toolbar>
        <TBtn
          type="button"
          $active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (⌘B)"
        >
          <TLabel style={{ fontWeight: 800 }}>B</TLabel>
        </TBtn>
        <TBtn
          type="button"
          $active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (⌘I)"
        >
          <TLabel style={{ fontStyle: 'italic' }}>I</TLabel>
        </TBtn>
        <TBtn
          type="button"
          $active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (⌘U)"
        >
          <TLabel style={{ textDecoration: 'underline' }}>U</TLabel>
        </TBtn>
        <TBtn
          type="button"
          $active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <TLabel style={{ textDecoration: 'line-through' }}>S</TLabel>
        </TBtn>
        <Sep />
        <TBtn
          type="button"
          $active={editor.isActive('link')}
          onClick={linkClick}
          title="Link"
        >
          <TLabel style={{ fontSize: 11 }}>http</TLabel>
        </TBtn>
        <Sep />
        <TBtn
          type="button"
          $active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </TBtn>
        <TBtn
          type="button"
          $active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </TBtn>
        <TBtn
          type="button"
          $active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          •
        </TBtn>
        <TBtn
          type="button"
          $active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          1.
        </TBtn>
        <TBtn
          type="button"
          $active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          “
        </TBtn>
        <TBtn
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          —
        </TBtn>
      </Toolbar>
      <EditorShell>
        <EditorContent editor={editor} />
      </EditorShell>
    </div>
  );
};

export default NotesRichEditor;
