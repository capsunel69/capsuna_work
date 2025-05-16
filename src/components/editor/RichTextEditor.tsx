import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import styled from 'styled-components';

const EditorContainer = styled.div`
  .ProseMirror {
    min-height: 400px;
    padding: 10px;
    border: 1px solid #999;
    background-color: white;
    border-radius: 4px;
    font-size: 1rem;
    line-height: 1.4;
    outline: none;

    &:focus {
      border-color: #4f94ea;
    }

    p {
      margin: 1em 0;
    }

    ul, ol {
      padding-left: 2em;
      margin: 1em 0;
    }

    h1, h2, h3, h4, h5, h6 {
      margin: 1em 0 0.5em;
      line-height: 1.2;
    }

    code {
      background-color: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: monospace;
    }

    blockquote {
      border-left: 3px solid #999;
      margin-left: 0;
      padding-left: 1em;
      font-style: italic;
    }

    a {
      color: #0078d7;
      text-decoration: underline;
      cursor: pointer;
    }
  }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 5px;
  padding: 8px;
  background-color: #f5f5f5;
  border: 1px solid #999;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
`;

const ToolButton = styled.button<{ active?: boolean }>`
  padding: 4px 8px;
  background: ${props => props.active ? '#d8e9f9' : 'white'};
  border: 1px solid #999;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: ${props => props.active ? '#d8e9f9' : '#f0f0f0'};
  }
`;

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Write your journal entry here...'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <EditorContainer>
      <Toolbar>
        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          B
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          I
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
        >
          U
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        >
          S
        </ToolButton>
        <ToolButton onClick={addLink} active={editor.isActive('link')}>
          Link
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          H2
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          H3
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          • List
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          1. List
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          Quote
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
        >
          Code
        </ToolButton>
      </Toolbar>
      <EditorContent editor={editor} />
    </EditorContainer>
  );
};

export default RichTextEditor; 