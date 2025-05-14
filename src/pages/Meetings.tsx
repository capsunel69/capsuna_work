import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import styled from 'styled-components';
import type { Meeting } from '../types';
import { OverdueTag } from '../components/shared/TagStyles';
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


const MeetingList = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888, 0 3px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background-color: #fff;
`;

const MeetingItem = styled.div<{ completed: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid #dfdfdf;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 12px;
  align-items: center;
  ${({ completed }) => completed && 'text-decoration: line-through; color: #888;'}
  
  &:last-child {
    border-bottom: none;
  }
`;

const MeetingActions = styled.div`
  display: flex;
  gap: 8px;
`;

const NoMeetings = styled.div`
  padding: 32px;
  text-align: center;
  color: #888;
  font-size: 1.1rem;
`;

const MeetingTitle = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
`;

const MeetingInfo = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
`;

const MeetingNotes = styled.div`
  font-size: 0.9rem;
  margin-top: 8px;
  font-style: italic;
  color: #555;
`;

const PageTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 20px;
  font-weight: bold;
  color: #333;
`;

const DeleteButton = styled.button`
  background: linear-gradient(to bottom, #f96c6c, #e53e3e);
  color: white;
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #c53030;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to bottom, #ff8080, #f05252);
  }
  
  &:active {
    background: #e53e3e;
  }
`;

const ActionButton = styled.button`
  font-size: 0.9rem;
  padding: 6px 12px;
  background: linear-gradient(to bottom, #4f94ea, #3a7bd5);
  color: white;
  border-radius: 4px;
  border: 1px solid #2c5ea9;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to bottom, #5ca0ff, #4485e6);
  }
  
  &:active {
    background: #3a7bd5;
  }
`;

const CompleteButton = styled.button<{ completed: boolean }>`
  font-size: 0.9rem;
  padding: 6px 12px;
  background: linear-gradient(to bottom, ${props => props.completed ? '#38a169' : '#4f94ea'}, ${props => props.completed ? '#2f855a' : '#3a7bd5'});
  color: white;
  border-radius: 4px;
  border: 1px solid ${props => props.completed ? '#2c7a50' : '#2c5ea9'};
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to bottom, ${props => props.completed ? '#48b179' : '#5ca0ff'}, ${props => props.completed ? '#3f9569' : '#4485e6'});
  }
  
  &:active {
    background: ${props => props.completed ? '#2f855a' : '#3a7bd5'};
  }
`;

// Modal styles
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
  padding: 24px;
  border-radius: 6px;
  width: 80%;
  max-width: 600px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.4rem;
  color: #333;
`;

const Meetings: React.FC = () => {
  const { meetings, addMeeting, updateMeeting, deleteMeeting, toggleMeetingCompletion } = useAppContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(30);
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');
  
  // Notes modal state
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  
  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setDuration(30);
    setParticipants('');
    setNotes('');
  };
  
  // Handle form submission
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
  
  // Handle opening notes modal
  const handleOpenNotesModal = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setEditingNotes(meeting.notes || '');
    setIsNotesModalOpen(true);
  };
  
  // Handle saving notes
  const handleSaveNotes = () => {
    if (editingMeetingId) {
      updateMeeting(editingMeetingId, { notes: editingNotes });
      setIsNotesModalOpen(false);
      setEditingMeetingId(null);
      setEditingNotes('');
    }
  };
  
  return (
    <div>
      <PageTitle>Meetings</PageTitle>
      
      <FormContainer>
        <form onSubmit={handleSubmit}>
          <FormRow>
            <Label htmlFor="title">Title:</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              required
            />
          </FormRow>
          
          <FormRow>
            <Label htmlFor="description">Description:</Label>
            <TextArea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={3}
            />
          </FormRow>
          
          <FormRowHorizontal>
            <FormRow>
              <Label htmlFor="date">Date and Time:</Label>
              <DateInput
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                required
              />
            </FormRow>
            
            <FormRow>
              <Label htmlFor="duration">Duration (minutes):</Label>
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
          
          <FormRowHorizontal>
            <FormRow>
              <Label htmlFor="participants">Participants (comma separated):</Label>
              <Input
                id="participants"
                value={participants}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParticipants(e.target.value)}
                placeholder="John Doe, Jane Smith"
              />
            </FormRow>
          </FormRowHorizontal>
          
          <FormRow>
            <Label htmlFor="notes">Notes:</Label>
            <TextArea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              rows={3}
            />
          </FormRow>
          
          <ButtonRow>
            <PrimaryButton type="submit">Add Meeting</PrimaryButton>
            <SecondaryButton type="button" onClick={resetForm}>Reset</SecondaryButton>
          </ButtonRow>
        </form>
      </FormContainer>
      
      <MeetingList>
        {meetings.length === 0 ? (
          <NoMeetings>No meetings yet. Add one above!</NoMeetings>
        ) : (
          meetings.map(meeting => (
            <MeetingItem key={meeting.id} completed={meeting.completed}>
              <input
                type="checkbox"
                checked={meeting.completed}
                onChange={() => toggleMeetingCompletion(meeting.id)}
              />
              
              <div>
                <MeetingTitle>
                  {meeting.title}
                  {!meeting.completed && new Date(meeting.date) < new Date() && (
                    <OverdueTag>OVERDUE</OverdueTag>
                  )}
                </MeetingTitle>
                {meeting.description && <div>{meeting.description}</div>}
                <MeetingInfo>
                  Date: {format(new Date(meeting.date), 'MMM d, yyyy h:mm a')}
                  {` • Duration: ${meeting.duration} minutes`}
                  {meeting.participants.length > 0 && 
                    ` • Participants: ${meeting.participants.join(', ')}`}
                </MeetingInfo>
                {meeting.notes && <MeetingNotes>Notes: {meeting.notes}</MeetingNotes>}
              </div>
              
              <div>
                <CompleteButton 
                  completed={meeting.completed}
                  onClick={() => toggleMeetingCompletion(meeting.id)}
                >
                  {meeting.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </CompleteButton>
              </div>
              
              <MeetingActions>
                <ActionButton
                  onClick={() => handleOpenNotesModal(meeting)}
                >
                  {meeting.notes ? 'Edit Notes' : 'Add Notes'}
                </ActionButton>
                <DeleteButton 
                  onClick={() => deleteMeeting(meeting.id)}
                >
                  Delete
                </DeleteButton>
              </MeetingActions>
            </MeetingItem>
          ))
        )}
      </MeetingList>
      
      {/* Notes Modal */}
      {isNotesModalOpen && (
        <ModalOverlay onClick={() => setIsNotesModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>
              {editingNotes ? 'Edit Meeting Notes' : 'Add Meeting Notes'}
            </ModalTitle>
            
            <FormContainer>
              <FormRow>
                <Label htmlFor="modalNotes">Notes:</Label>
                <TextArea
                  id="modalNotes"
                  value={editingNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingNotes(e.target.value)}
                  rows={6}
                  autoFocus
                />
              </FormRow>
              
              <ButtonRow>
                <PrimaryButton onClick={handleSaveNotes}>Save Notes</PrimaryButton>
                <SecondaryButton onClick={() => setIsNotesModalOpen(false)}>Cancel</SecondaryButton>
              </ButtonRow>
            </FormContainer>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
};

export default Meetings; 