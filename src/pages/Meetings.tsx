import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import styled from 'styled-components';
import type { Meeting } from '../types';
import LinkifyText from '../components/shared/LinkifyText';
import {
  FormContainer,
  FormRow,
  FormRowHorizontal,
  Label,
  Input,
  DateInput,
  TextArea,
  ButtonRow,
  PrimaryButton,
  SecondaryButton
} from '../components/shared/FormStyles';

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled.h1`
  font-size: 18px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #003087;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:before {
    content: '📅';
    font-size: 20px;
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const CardHeader = styled.div<{ color?: string }>`
  background: ${props => props.color || '#0a246a'};
  color: white;
  padding: 10px 15px;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardBody = styled.div`
  padding: 0;
`;

const MeetingItem = styled.div<{ completed?: boolean }>`
  padding: 15px;
  border-bottom: 1px solid #e5e5e5;
  background: ${props => props.completed ? '#fafafa' : '#fff'};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${props => props.completed ? '#f5f5f5' : '#f0f4ff'};
  }
`;

const MeetingHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const Checkbox = styled.button<{ checked: boolean }>`
  width: 20px;
  height: 20px;
  min-width: 20px;
  border: 2px solid ${props => props.checked ? '#28a745' : '#aaa'};
  background: ${props => props.checked ? '#28a745' : '#fff'};
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  
  &:after {
    content: '${props => props.checked ? '✓' : ''}';
    color: white;
    font-size: 14px;
    font-weight: bold;
  }
`;

const MeetingContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const MeetingTitle = styled.h3<{ completed?: boolean }>`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: ${props => props.completed ? '#888' : '#1a1a1a'};
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Badge = styled.span<{ variant?: 'danger' | 'info' }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => props.variant === 'danger' ? '#dc3545' : '#17a2b8'};
  color: white;
`;

const MeetingDescription = styled.p`
  font-size: 13px;
  color: #555;
  margin: 0 0 8px 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const MeetingMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
`;

const MeetingNotes = styled.div`
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-left: 3px solid #0a246a;
  font-size: 13px;
  color: #555;
  white-space: pre-wrap;
`;

const MeetingActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 6px 14px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#dc3545';
      case 'secondary': return '#6c757d';
      default: return '#007bff';
    }
  }};
  color: white;
  
  &:hover {
    background: ${props => {
      switch (props.variant) {
        case 'danger': return '#c82333';
        case 'secondary': return '#5a6268';
        default: return '#0056b3';
      }
    }};
  }
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #888;
  font-size: 14px;
`;

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
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 6px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #1a1a1a;
`;

const Meetings: React.FC = () => {
  const { meetings, addMeeting, updateMeeting, deleteMeeting, toggleMeetingCompletion } = useAppContext();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(30);
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setDuration(30);
    setParticipants('');
    setNotes('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMeeting({
      title,
      description,
      date: new Date(date),
      duration,
      participants: participants.split(',').map(p => p.trim()).filter(p => p !== ''),
      notes,
      completed: false,
    });
    resetForm();
  };
  
  const handleOpenNotesModal = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setEditingNotes(meeting.notes || '');
    setIsNotesModalOpen(true);
  };
  
  const handleSaveNotes = () => {
    if (editingMeetingId) {
      updateMeeting(editingMeetingId, { notes: editingNotes });
      setIsNotesModalOpen(false);
      setEditingMeetingId(null);
      setEditingNotes('');
    }
  };

  const upcomingMeetings = meetings.filter(m => !m.completed);
  const completedMeetings = meetings.filter(m => m.completed);
  
  return (
    <PageContainer>
      <PageTitle>Meetings</PageTitle>
      
      <Card>
        <CardHeader color="linear-gradient(180deg, #495057, #343a40)">
          ➕ Schedule New Meeting
        </CardHeader>
        <div style={{ padding: 15 }}>
          <form onSubmit={handleSubmit}>
            <FormRow>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="Meeting title..."
                required
              />
            </FormRow>
            
            <FormRow>
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Meeting agenda or details..."
                rows={2}
              />
            </FormRow>
            
            <FormRowHorizontal>
              <FormRow>
                <Label htmlFor="date">Date & Time</Label>
                <DateInput
                  id="date"
                  type="datetime-local"
                  value={date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                  required
                />
              </FormRow>
              
              <FormRow>
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(Number(e.target.value))}
                  min={5}
                  required
                />
              </FormRow>
            </FormRowHorizontal>
            
            <FormRow>
              <Label htmlFor="participants">Participants (comma separated)</Label>
              <Input
                id="participants"
                value={participants}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParticipants(e.target.value)}
                placeholder="John, Jane, Alex..."
              />
            </FormRow>
            
            <ButtonRow>
              <PrimaryButton type="submit">+ Schedule Meeting</PrimaryButton>
              <SecondaryButton type="button" onClick={resetForm}>Clear</SecondaryButton>
            </ButtonRow>
          </form>
        </div>
      </Card>
      
      <Card>
        <CardHeader>
          📅 Upcoming Meetings ({upcomingMeetings.length})
        </CardHeader>
        <CardBody>
          {upcomingMeetings.length === 0 ? (
            <EmptyState>No upcoming meetings scheduled</EmptyState>
          ) : (
            upcomingMeetings.map(meeting => (
              <MeetingItem key={meeting.id}>
                <MeetingHeader>
                  <Checkbox
                    checked={false}
                    onClick={() => toggleMeetingCompletion(meeting.id)}
                  />
                  <MeetingContent>
                    <MeetingTitle>
                      {meeting.title}
                      {new Date(meeting.date) < new Date() && <Badge variant="danger">OVERDUE</Badge>}
                    </MeetingTitle>
                    {meeting.description && (
                      <MeetingDescription>
                        <LinkifyText text={meeting.description} />
                      </MeetingDescription>
                    )}
                    <MeetingMeta>
                      <span>📅 {format(new Date(meeting.date), 'MMM d, yyyy h:mm a')}</span>
                      <span>⏱ {meeting.duration} min</span>
                      {meeting.participants.length > 0 && (
                        <span>👥 {meeting.participants.join(', ')}</span>
                      )}
                    </MeetingMeta>
                    {meeting.notes && (
                      <MeetingNotes>
                        <strong>Notes:</strong> {meeting.notes}
                      </MeetingNotes>
                    )}
                  </MeetingContent>
                  <MeetingActions>
                    <Button onClick={() => handleOpenNotesModal(meeting)}>
                      {meeting.notes ? '✎ Notes' : '+ Notes'}
                    </Button>
                    <Button variant="danger" onClick={() => deleteMeeting(meeting.id)}>
                      ✕
                    </Button>
                  </MeetingActions>
                </MeetingHeader>
              </MeetingItem>
            ))
          )}
        </CardBody>
      </Card>
      
      {completedMeetings.length > 0 && (
        <Card>
          <CardHeader color="linear-gradient(180deg, #6c757d, #545b62)">
            ✅ Completed Meetings ({completedMeetings.length})
          </CardHeader>
          <CardBody>
            {completedMeetings.map(meeting => (
              <MeetingItem key={meeting.id} completed>
                <MeetingHeader>
                  <Checkbox
                    checked={true}
                    onClick={() => toggleMeetingCompletion(meeting.id)}
                  />
                  <MeetingContent>
                    <MeetingTitle completed>{meeting.title}</MeetingTitle>
                    <MeetingMeta>
                      <span>📅 {format(new Date(meeting.date), 'MMM d, yyyy')}</span>
                      <span>⏱ {meeting.duration} min</span>
                    </MeetingMeta>
                  </MeetingContent>
                  <MeetingActions>
                    <Button variant="danger" onClick={() => deleteMeeting(meeting.id)}>
                      ✕
                    </Button>
                  </MeetingActions>
                </MeetingHeader>
              </MeetingItem>
            ))}
          </CardBody>
        </Card>
      )}
      
      {isNotesModalOpen && (
        <ModalOverlay onClick={() => setIsNotesModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>📝 Meeting Notes</ModalTitle>
            <FormRow>
              <TextArea
                value={editingNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingNotes(e.target.value)}
                rows={6}
                placeholder="Add meeting notes..."
                autoFocus
              />
            </FormRow>
            <ButtonRow>
              <PrimaryButton onClick={handleSaveNotes}>Save Notes</PrimaryButton>
              <SecondaryButton onClick={() => setIsNotesModalOpen(false)}>Cancel</SecondaryButton>
            </ButtonRow>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default Meetings;
