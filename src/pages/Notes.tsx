import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { format, formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppContext } from '../context/AppContext';
import type { Journal } from '../types';
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  Button, Input, Textarea, EmptyState, Badge, IconButton, Spinner,
} from '../components/ui/primitives';
import {
  IconNote, IconPlus, IconTrash, IconSearch, IconChevronLeft, IconEdit, IconCheck,
} from '../components/ui/icons';

const Shell = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: var(--s-4);
  align-items: stretch;
  min-height: calc(100vh - 160px);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`;

const ListColumn = styled.div<{ $hidden?: boolean }>`
  display: ${(p) => (p.$hidden ? 'none' : 'flex')};
  flex-direction: column;
  min-height: 0;
  background: var(--bg-1);
  border: 1px solid var(--border-1);
  border-radius: var(--r-lg);
  overflow: hidden;

  @media (min-width: 901px) {
    max-height: calc(100vh - 120px);
  }
`;

const EditorColumn = styled.div<{ $hidden?: boolean }>`
  display: ${(p) => (p.$hidden ? 'none' : 'flex')};
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background: var(--bg-1);
  border: 1px solid var(--border-1);
  border-radius: var(--r-lg);
  overflow: hidden;

  @media (min-width: 901px) {
    max-height: calc(100vh - 120px);
  }
`;

const ListHeader = styled.div`
  padding: var(--s-3) var(--s-4);
  border-bottom: 1px solid var(--border-1);
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  flex-shrink: 0;
  background: var(--bg-2);
`;

const SearchWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    position: absolute;
    left: 10px;
    width: 15px;
    height: 15px;
    color: var(--text-4);
    pointer-events: none;
  }

  input {
    padding-left: 32px;
  }
`;

const ListScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

const NoteListButton = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid var(--border-1);
  background: ${(p) => (p.$active ? 'var(--bg-3)' : 'transparent')};
  text-align: left;
  cursor: pointer;
  transition: background 0.12s;
  min-height: 0;

  &:hover {
    background: var(--bg-3);
  }
`;

const NoteTitle = styled.div`
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-1);
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NoteSnippet = styled.div`
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  font-size: 10.5px;
  color: var(--text-4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const EditorHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border-bottom: 1px solid var(--border-1);
  flex-shrink: 0;
  background: var(--bg-2);
`;

const EditorBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: var(--s-4);
  gap: var(--s-3);
  overflow: hidden;
`;

const TitleInput = styled(Input)`
  font-size: 18px;
  font-weight: 600;
  padding: 10px 12px;
`;

const TagsField = styled(Input)`
  font-size: 12px;
  font-family: var(--font-mono);
`;

const BodyTextarea = styled(Textarea)`
  flex: 1;
  min-height: 200px;
  font-size: 14px;
  line-height: 1.65;
  resize: none;
`;

const PreviewBox = styled.div`
  flex: 1;
  min-height: 200px;
  overflow: auto;
  background: var(--bg-0);
  border: 1px solid var(--border-1);
  border-radius: var(--r-sm);
  padding: var(--s-4);
  font-size: 14px;
  line-height: 1.65;
  color: var(--text-1);

  p { margin: 0 0 10px; }
  p:last-child { margin-bottom: 0; }
  h1, h2, h3, h4 { margin: 14px 0 8px; line-height: 1.3; }
  h1 { font-size: 1.25rem; }
  h2 { font-size: 1.1rem; }
  ul, ol { margin: 0 0 10px 20px; }
  a { color: var(--accent); }
  pre {
    background: var(--bg-2);
    border: 1px solid var(--border-1);
    border-radius: 8px;
    padding: 10px 12px;
    overflow: auto;
    font-size: 12.5px;
  }
  code {
    font-family: var(--font-mono);
    font-size: 12.5px;
    background: var(--bg-2);
    padding: 1px 5px;
    border-radius: 4px;
  }
  blockquote {
    margin: 0 0 10px;
    padding-left: 12px;
    border-left: 3px solid var(--accent);
    color: var(--text-2);
  }
`;

const Segmented = styled.div`
  display: inline-flex;
  border: 1px solid var(--border-1);
  border-radius: var(--r-sm);
  overflow: hidden;
  margin-left: auto;
`;

const SegBtn = styled.button<{ $on?: boolean }>`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border: 0;
  background: ${(p) => (p.$on ? 'var(--bg-3)' : 'transparent')};
  color: ${(p) => (p.$on ? 'var(--text-1)' : 'var(--text-3)')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: var(--text-1);
  }
`;

const SaveHint = styled.span`
  font-size: 11.5px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
`;

function journalSortTime(j: Journal): number {
  const u = j.updatedAt ? new Date(j.updatedAt).getTime() : 0;
  const d = j.date ? new Date(j.date).getTime() : 0;
  const c = j.createdAt ? new Date(j.createdAt).getTime() : 0;
  return Math.max(u, d, c);
}

function snippet(text: string, max = 100): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t || 'Empty note';
  return `${t.slice(0, max)}…`;
}

const Notes: React.FC = () => {
  const { journals, isLoading, addJournal, updateJournal, deleteJournal } = useAppContext();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'list' | 'editor'>('list');
  const [isNarrow, setIsNarrow] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const sorted = useMemo(() => {
    const withDates = journals.map((j) => ({ j, t: journalSortTime(j) }));
    withDates.sort((a, b) => b.t - a.t);
    return withDates.map((x) => x.j);
  }, [journals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((j) => {
      if (j.title.toLowerCase().includes(q)) return true;
      if (j.content.toLowerCase().includes(q)) return true;
      if (j.tags?.some((t) => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [sorted, search]);

  const selected = useMemo(
    () => (selectedId ? journals.find((j) => j.id === selectedId) ?? null : null),
    [journals, selectedId],
  );

  // Keep selection in sync if note deleted
  useEffect(() => {
    if (selectedId && !journals.some((j) => j.id === selectedId)) {
      setSelectedId(null);
      if (isNarrow) setMobilePanel('list');
    }
  }, [journals, selectedId, isNarrow]);

  // Load editor when selection changes
  useEffect(() => {
    if (!selected) {
      setTitle('');
      setContent('');
      setTagsInput('');
      lastSavedRef.current = '';
      return;
    }
    setTitle(selected.title);
    setContent(selected.content || '');
    setTagsInput((selected.tags || []).join(', '));
    const sig = `${selected.title}\0${selected.content || ''}\0${(selected.tags || []).join(',')}`;
    lastSavedRef.current = sig;
  }, [selected?.id, selectedId]);

  const pushSave = useCallback(() => {
    if (!selectedId || !selected) return;
    const tagParts = tagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const sig = `${title}\0${content}\0${tagParts.join(',')}`;
    if (sig === lastSavedRef.current) {
      setSaveState('idle');
      return;
    }
    setSaveState('saving');
    void (async () => {
      try {
        await updateJournal(selectedId, {
          title: title.trim() || 'Untitled',
          content,
          tags: tagParts,
        });
        lastSavedRef.current = sig;
        setSaveState('saved');
        window.setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    })();
  }, [selectedId, selected, title, content, tagsInput, updateJournal]);

  useEffect(() => {
    if (!selectedId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      pushSave();
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, content, tagsInput, selectedId, pushSave]);

  const handleNew = async () => {
    setSaveState('idle');
    await addJournal({
      title: 'Untitled',
      content: '',
      date: new Date(),
      tags: [],
    });
  };

  useEffect(() => {
    if (journals.length === 0) return;
    const latest = sorted[0];
    if (!selectedId) {
      setSelectedId(latest.id);
    }
  }, [journals.length, selectedId, sorted]);

  // After addJournal, select newest (last in list is actually first in sorted)
  const prevLen = useRef(journals.length);
  useEffect(() => {
    if (journals.length > prevLen.current) {
      const newest = sorted[0];
      if (newest) {
        setSelectedId(newest.id);
        if (isNarrow) setMobilePanel('editor');
      }
    }
    prevLen.current = journals.length;
  }, [journals.length, sorted, isNarrow]);

  const openNote = (id: string) => {
    setSelectedId(id);
    setMode('write');
    if (isNarrow) setMobilePanel('editor');
  };

  const handleDelete = () => {
    if (!selectedId) return;
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    const remaining = sorted.filter((j) => j.id !== selectedId);
    void deleteJournal(selectedId);
    setSelectedId(remaining[0]?.id ?? null);
    if (isNarrow) setMobilePanel(remaining[0] ? 'editor' : 'list');
  };

  const showList = !isNarrow || mobilePanel === 'list';
  const showEditor = !isNarrow || mobilePanel === 'editor';

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>
            <IconNote />
            Notes
          </PageTitle>
          <PageSubtitle>
            Journals with search, tags, and markdown preview. Edits save automatically.
          </PageSubtitle>
        </div>
      </PageHeader>

      <Shell>
        <ListColumn $hidden={!showList}>
          <ListHeader>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button $variant="primary" $size="sm" onClick={handleNew} type="button" style={{ flex: 1 }}>
                <IconPlus />
                New note
              </Button>
            </div>
            <SearchWrap>
              <IconSearch />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, body, tags…"
                aria-label="Search notes"
              />
            </SearchWrap>
          </ListHeader>
          <ListScroll>
            {isLoading && journals.length === 0 ? (
              <EmptyState>
                <Spinner />
                <div style={{ marginTop: 8 }}>Loading…</div>
              </EmptyState>
            ) : filtered.length === 0 ? (
              <EmptyState>
                {journals.length === 0
                  ? 'No notes yet — create your first one.'
                  : 'No notes match your search.'}
              </EmptyState>
            ) : (
              filtered.map((j) => {
                const active = j.id === selectedId;
                const when = new Date(journalSortTime(j));
                return (
                  <NoteListButton
                    key={j.id}
                    $active={active}
                    type="button"
                    onClick={() => openNote(j.id)}
                  >
                    <NoteTitle>{j.title || 'Untitled'}</NoteTitle>
                    <NoteSnippet>{snippet(j.content || '')}</NoteSnippet>
                    <Meta>
                      <span title={format(when, 'PPpp')}>
                        {formatDistanceToNow(when, { addSuffix: true })}
                      </span>
                      {j.tags && j.tags.length > 0 ? (
                        <TagRow>
                          {j.tags.slice(0, 3).map((t) => (
                            <Badge key={t} $variant="neutral" style={{ fontSize: 10, padding: '2px 6px' }}>{t}</Badge>
                          ))}
                        </TagRow>
                      ) : <span />}
                    </Meta>
                  </NoteListButton>
                );
              })
            )}
          </ListScroll>
        </ListColumn>

        <EditorColumn $hidden={!showEditor}>
          {!selected && journals.length > 0 ? (
            <EmptyState style={{ margin: 'auto', padding: 24 }}>Select a note from the list</EmptyState>
          ) : !selected && journals.length === 0 ? (
            <EmptyState style={{ margin: 'auto', padding: 24 }}>
              Create a note to start writing.
            </EmptyState>
          ) : (
            <>
              <EditorHeader>
                {isNarrow && (
                  <IconButton
                    $variant="ghost"
                    $size="sm"
                    aria-label="Back to list"
                    onClick={() => setMobilePanel('list')}
                  >
                    <IconChevronLeft />
                  </IconButton>
                )}
                {saveState === 'saving' && <SaveHint>Saving…</SaveHint>}
                {saveState === 'saved' && <SaveHint>Saved</SaveHint>}
                {saveState === 'error' && <SaveHint style={{ color: 'var(--danger)' }}>Save failed</SaveHint>}
                <Segmented>
                  <SegBtn
                    type="button"
                    $on={mode === 'write'}
                    onClick={() => setMode('write')}
                  >
                    <IconEdit />
                    Write
                  </SegBtn>
                  <SegBtn
                    type="button"
                    $on={mode === 'preview'}
                    onClick={() => setMode('preview')}
                  >
                    <IconCheck />
                    Preview
                  </SegBtn>
                </Segmented>
                <IconButton
                  $variant="ghost"
                  $size="sm"
                  title="Delete note"
                  onClick={handleDelete}
                  style={{ marginLeft: isNarrow ? 0 : 8 }}
                >
                  <IconTrash />
                </IconButton>
              </EditorHeader>
              <EditorBody>
                <TitleInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                />
                <TagsField
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Tags — comma separated (work, ideas, capsuna)"
                />
                {mode === 'write' ? (
                  <BodyTextarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write in Markdown. Use **bold**, lists, links, and code blocks."
                  />
                ) : (
                  <PreviewBox>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content || '_Nothing written yet._'}
                    </ReactMarkdown>
                  </PreviewBox>
                )}
              </EditorBody>
            </>
          )}
        </EditorColumn>
      </Shell>
    </PageContainer>
  );
};

export default Notes;
