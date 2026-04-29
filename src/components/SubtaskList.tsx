import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import type { Subtask, Task } from '../types';
import { Checkbox } from './ui/primitives';
import { IconPlus, IconTrash } from './ui/icons';

/**
 * Inline checklist for a Task.
 *
 * The list is intentionally tight (smaller font/padding than the parent task
 * row) so a task with several subtasks still feels like one block instead of
 * a deeply nested tree.
 */

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0 2px;
`;

const Item = styled.div<{ $done?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: 4px 6px;
  border-radius: var(--r-xs);
  transition: background 0.15s;
  min-height: 28px;

  &:hover { background: var(--bg-3); }
  &:hover .delete { opacity: 1; }
`;

const ItemTitle = styled.input<{ $done?: boolean }>`
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: ${(p) => (p.$done ? 'var(--text-3)' : 'var(--text-1)')};
  text-decoration: ${(p) => (p.$done ? 'line-through' : 'none')};
  padding: 4px 2px;
  outline: 0;

  &:focus {
    background: var(--bg-2);
    border-radius: var(--r-xs);
  }

  @media (max-width: 720px) {
    font-size: 16px;
  }
`;

const DeleteBtn = styled.button`
  opacity: 0;
  background: transparent;
  border: 0;
  padding: 4px;
  border-radius: var(--r-xs);
  color: var(--text-3);
  cursor: pointer;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
  display: flex;
  align-items: center;

  &:hover { color: var(--danger); background: var(--danger-soft); }

  svg { width: 12px; height: 12px; }

  /* Always visible on touch devices where there's no hover. */
  @media (hover: none) {
    opacity: 0.6;
  }
`;

const AddRow = styled.form`
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: 4px 6px;
  border-radius: var(--r-xs);
  min-height: 28px;

  &:focus-within { background: var(--bg-3); }
`;

const AddIcon = styled.span`
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: var(--r-xs);
  border: 1.5px dashed var(--border-3);
  color: var(--text-3);

  svg { width: 12px; height: 12px; }
`;

const AddInput = styled.input`
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--text-1);
  padding: 4px 2px;
  outline: 0;

  &::placeholder { color: var(--text-4); }

  @media (max-width: 720px) {
    font-size: 16px;
  }
`;

const Progress = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
  padding: 2px 6px;

  .bar {
    flex: 1;
    height: 3px;
    border-radius: 999px;
    background: var(--bg-3);
    overflow: hidden;
    max-width: 140px;
  }

  .fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--purple));
    transition: width 0.25s ease;
  }
`;

interface Props {
  task: Task;
  onChange: (taskId: string, updates: Partial<Task>) => void;
  disabled?: boolean;
  /** When true, render in a compact read-only-ish mode (used in the
   *  completed list where subtasks are just historical context). */
  compact?: boolean;
}

const SubtaskList: React.FC<Props> = ({ task, onChange, disabled, compact }) => {
  const subtasks = task.subtasks ?? [];
  const [draftTitle, setDraftTitle] = useState('');
  const addInputRef = useRef<HTMLInputElement | null>(null);

  const persist = (next: Subtask[]): void => {
    onChange(task.id, { subtasks: next });
  };

  const toggle = (id: string): void => {
    persist(
      subtasks.map((s) =>
        s.id === id ? { ...s, completed: !s.completed } : s,
      ),
    );
  };

  const rename = (id: string, title: string): void => {
    persist(subtasks.map((s) => (s.id === id ? { ...s, title } : s)));
  };

  const remove = (id: string): void => {
    persist(subtasks.filter((s) => s.id !== id));
  };

  const add = (e: React.FormEvent): void => {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title) return;
    const newItem: Subtask = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date(),
    };
    persist([...subtasks, newItem]);
    setDraftTitle('');
    // Keep focus so the user can add several in a row.
    requestAnimationFrame(() => addInputRef.current?.focus());
  };

  const total = subtasks.length;
  const done = subtasks.filter((s) => s.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  if (compact) {
    if (total === 0) return null;
    return (
      <Progress aria-label={`${done} of ${total} subtasks complete`}>
        <span>{done}/{total}</span>
        <span className="bar"><span className="fill" style={{ width: `${pct}%` }} /></span>
      </Progress>
    );
  }

  return (
    <Wrap>
      {total > 0 && (
        <Progress aria-label={`${done} of ${total} subtasks complete`}>
          <span>{done}/{total}</span>
          <span className="bar"><span className="fill" style={{ width: `${pct}%` }} /></span>
        </Progress>
      )}

      {subtasks.map((s) => (
        <Item key={s.id} $done={s.completed}>
          <Checkbox
            $checked={s.completed}
            onClick={() => toggle(s.id)}
            disabled={disabled}
            aria-label={s.completed ? 'Mark incomplete' : 'Mark complete'}
          />
          <ItemTitle
            value={s.title}
            $done={s.completed}
            onChange={(e) => rename(s.id, e.target.value)}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (next !== s.title) rename(s.id, next || s.title);
              if (!next) remove(s.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
                requestAnimationFrame(() => addInputRef.current?.focus());
              }
            }}
            disabled={disabled}
          />
          <DeleteBtn
            type="button"
            className="delete"
            onClick={() => remove(s.id)}
            disabled={disabled}
            aria-label="Delete subtask"
            title="Delete subtask"
          >
            <IconTrash />
          </DeleteBtn>
        </Item>
      ))}

      <AddRow onSubmit={add}>
        <AddIcon><IconPlus /></AddIcon>
        <AddInput
          ref={addInputRef}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder={total === 0 ? 'Add a subtask…' : 'Add another…'}
          disabled={disabled}
        />
      </AddRow>
    </Wrap>
  );
};

export default SubtaskList;
