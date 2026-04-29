import React, { useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import type { Meeting } from '../types';
import LinkifyText from '../components/shared/LinkifyText';
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  Card, CardHeader, CardTitle, CardSubtle, CardBody, CardSection,
  Button, IconButton, Badge, Checkbox, EmptyState,
  Stack, Row, Textarea,
  ModalOverlay, ModalCard,
  Composer, ComposerTitle, ComposerBody, ComposerToolbar, ComposerSpacer,
  Chip, GhostInput,
} from '../components/ui/primitives';
import {
  IconCalendar, IconPlus, IconTrash, IconEdit, IconClock, IconUsers, IconX,
} from '../components/ui/icons';

const MeetingRow = styled.div<{ $done?: boolean }>`
  padding: var(--s-4) var(--s-5);
  display: flex;
  gap: var(--s-3);
  align-items: flex-start;
  border-top: 1px solid var(--border-1);

  &:first-child { border-top: none; }
  &:hover { background: var(--bg-3); }

  ${p => p.$done && `opacity: 0.7;`}

  @media (max-width: 720px) {
    padding: var(--s-3);
    gap: var(--s-2);
    flex-wrap: wrap;
  }
`;

const Title = styled.h3<{ $done?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${p => p.$done ? 'var(--text-3)' : 'var(--text-1)'};
  text-decoration: ${p => p.$done ? 'line-through' : 'none'};
  display: flex;
  align-items: center;
  gap: var(--s-2);
  flex-wrap: wrap;
`;

const Description = styled.p`
  font-size: 13px;
  color: var(--text-2);
  margin: 6px 0 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-4);
  font-size: 12px;
  color: var(--text-3);
  margin-top: var(--s-2);

  span { display: flex; align-items: center; gap: 6px; }
  svg { width: 13px; height: 13px; }
`;

const NotesBox = styled.div`
  margin-top: var(--s-3);
  padding: var(--s-3);
  background: var(--bg-1);
  border: 1px solid var(--border-1);
  border-left: 2px solid var(--accent);
  border-radius: var(--r-sm);
  font-size: 13px;
  color: var(--text-2);
  white-space: pre-wrap;
  line-height: 1.55;

  strong { color: var(--text-1); margin-right: 6px; }
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;

  @media (max-width: 720px) {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
    margin-top: 4px;
  }
`;

const Meetings: React.FC = () => {
  const { meetings, addMeeting, updateMeeting, deleteMeeting, toggleMeetingCompletion } = useAppContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(30);
  const [participants, setParticipants] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [open, setOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const reset = () => {
    setTitle(''); setDescription(''); setDate(''); setDuration(30); setParticipants('');
    setShowDescription(false); setShowParticipants(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addMeeting({
      title, description, date: new Date(date), duration,
      participants: participants.split(',').map(p => p.trim()).filter(Boolean),
      notes: '', completed: false,
    });
    reset();
  };

  const openNotes = (m: Meeting) => { setEditingId(m.id); setEditingNotes(m.notes || ''); setOpen(true); };
  const saveNotes = () => {
    if (editingId) {
      updateMeeting(editingId, { notes: editingNotes });
      setOpen(false); setEditingId(null); setEditingNotes('');
    }
  };

  const upcoming = meetings.filter(m => !m.completed);
  const completed = meetings.filter(m => m.completed);

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle><IconCalendar /> Meetings</PageTitle>
          <PageSubtitle>Schedule, attend, document</PageSubtitle>
        </div>
      </PageHeader>

      <Composer onSubmit={submit}>
        <ComposerTitle
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Meeting title…"
          required
        />
        {(showDescription || description) && (
          <ComposerBody
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Agenda, links, context…"
            rows={2}
          />
        )}
        {(showParticipants || participants) && (
          <ComposerBody
            value={participants}
            onChange={e => setParticipants(e.target.value)}
            placeholder="Participants — comma separated"
            rows={1}
            style={{ minHeight: 28 }}
          />
        )}
        <ComposerToolbar>
          <GhostInput
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            aria-label="Date and time"
          />
          <GhostInput
            type="number"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            min={5}
            step={5}
            aria-label="Duration in minutes"
            title="Duration (min)"
          />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>min</span>

          <Chip type="button" $active={showDescription} onClick={() => setShowDescription(s => !s)}>
            <IconEdit /> {showDescription ? 'Hide agenda' : 'Agenda'}
          </Chip>
          <Chip type="button" $active={showParticipants} onClick={() => setShowParticipants(s => !s)}>
            <IconUsers /> {showParticipants ? 'Hide people' : 'People'}
          </Chip>

          <ComposerSpacer />
          {(title || description || date || participants) && (
            <Chip type="button" onClick={reset}>Clear</Chip>
          )}
          <Button $variant="primary" $size="sm" type="submit" disabled={!title.trim() || !date}>
            <IconPlus /> Schedule
          </Button>
        </ComposerToolbar>
      </Composer>

      <Card>
        <CardHeader><CardTitle><IconCalendar /> Upcoming <CardSubtle>{upcoming.length}</CardSubtle></CardTitle></CardHeader>
        <CardBody>
          {upcoming.length === 0 ? (
            <EmptyState><IconCalendar /><div>No upcoming meetings.</div></EmptyState>
          ) : upcoming.map(m => (
            <MeetingRow key={m.id}>
              <Checkbox $checked={false} onClick={() => toggleMeetingCompletion(m.id)} style={{ marginTop: 3 }} />
              <Body>
                <Title>
                  {m.title}
                  {new Date(m.date) < new Date() && <Badge $variant="danger">Overdue</Badge>}
                </Title>
                {m.description && <Description><LinkifyText text={m.description} /></Description>}
                <MetaRow>
                  <span><IconClock /> {format(new Date(m.date), 'MMM d, yyyy · HH:mm')}</span>
                  <span><IconClock /> {m.duration} min</span>
                  {m.participants.length > 0 && <span><IconUsers /> {m.participants.join(', ')}</span>}
                </MetaRow>
                {m.notes && <NotesBox><strong>Notes</strong>{m.notes}</NotesBox>}
              </Body>
              <Actions>
                <Button $size="sm" $variant="ghost" onClick={() => openNotes(m)}>
                  <IconEdit /> {m.notes ? 'Notes' : 'Add notes'}
                </Button>
                <IconButton $size="sm" $variant="danger" onClick={() => deleteMeeting(m.id)} title="Delete">
                  <IconTrash />
                </IconButton>
              </Actions>
            </MeetingRow>
          ))}
        </CardBody>
      </Card>

      {completed.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Completed <CardSubtle>{completed.length}</CardSubtle></CardTitle></CardHeader>
          <CardBody>
            {completed.map(m => (
              <MeetingRow key={m.id} $done>
                <Checkbox $checked={true} onClick={() => toggleMeetingCompletion(m.id)} style={{ marginTop: 3 }} />
                <Body>
                  <Title $done>{m.title}</Title>
                  <MetaRow>
                    <span><IconClock /> {format(new Date(m.date), 'MMM d, yyyy')}</span>
                    <span><IconClock /> {m.duration} min</span>
                  </MetaRow>
                </Body>
                <Actions>
                  <IconButton $size="sm" $variant="danger" onClick={() => deleteMeeting(m.id)} title="Delete">
                    <IconTrash />
                  </IconButton>
                </Actions>
              </MeetingRow>
            ))}
          </CardBody>
        </Card>
      )}

      {open && (
        <ModalOverlay onClick={() => setOpen(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle><IconEdit /> Meeting notes</CardTitle>
              <IconButton $variant="ghost" $size="sm" onClick={() => setOpen(false)}><IconX /></IconButton>
            </CardHeader>
            <CardSection>
              <Stack $gap={3}>
                <Textarea value={editingNotes} onChange={e => setEditingNotes(e.target.value)} rows={8} placeholder="Capture key points, decisions, action items…" autoFocus />
                <Row $gap={2}>
                  <Button $variant="primary" onClick={saveNotes}>Save notes</Button>
                  <Button $variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                </Row>
              </Stack>
            </CardSection>
          </ModalCard>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default Meetings;
