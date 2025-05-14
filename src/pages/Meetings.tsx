import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styled from 'styled-components';
import { format } from 'date-fns';
import {
  FormContainer,
  FormRow,
  FormRowHorizontal,
  Label,
  Input,
  Select,
  TextArea,
  ButtonRow,
  PrimaryButton,
  SecondaryButton
} from '../components/shared/FormStyles';

const MeetingsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

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
  grid-template-columns: auto 1fr auto;
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

const Meetings: React.FC = () => {
  const { meetings, addMeeting, updateMeeting, deleteMeeting, toggleMeetingCompletion } = useAppContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(30);
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');
  
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
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </FormRow>
          
          <FormRow>
            <Label htmlFor="description">Description:</Label>
            <TextArea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </FormRow>
          
          <FormRowHorizontal>
            <FormRow>
              <Label htmlFor="date">Date and Time:</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </FormRow>
            
            <FormRow>
              <Label htmlFor="duration">Duration (minutes):</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
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
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="John Doe, Jane Smith"
              />
            </FormRow>
          </FormRowHorizontal>
          
          <FormRow>
            <Label htmlFor="notes">Notes:</Label>
            <TextArea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
                <MeetingTitle>{meeting.title}</MeetingTitle>
                {meeting.description && <div>{meeting.description}</div>}
                <MeetingInfo>
                  Date: {format(new Date(meeting.date), 'MMM d, yyyy h:mm a')}
                  {` • Duration: ${meeting.duration} minutes`}
                  {meeting.participants.length > 0 && 
                    ` • Participants: ${meeting.participants.join(', ')}`}
                </MeetingInfo>
                {meeting.notes && <MeetingNotes>Notes: {meeting.notes}</MeetingNotes>}
              </div>
              
              <MeetingActions>
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
    </div>
  );
};

export default Meetings; 