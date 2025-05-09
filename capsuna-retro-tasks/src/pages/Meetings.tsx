import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styled from 'styled-components';
import { format } from 'date-fns';

const MeetingsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const MeetingForm = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
  padding: 16px;
  margin-bottom: 16px;
`;

const MeetingList = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
`;

const MeetingItem = styled.div<{ completed: boolean }>`
  padding: 8px 16px;
  border-bottom: 1px solid #dfdfdf;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
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
`;

const FormRow = styled.div`
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 4px;
`;

const MeetingTitle = styled.div`
  font-weight: bold;
`;

const MeetingInfo = styled.div`
  font-size: 0.8em;
  color: #888;
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
      <h2>Meetings</h2>
      
      <MeetingForm>
        <form onSubmit={handleSubmit}>
          <FormRow>
            <Label htmlFor="title">Title:</Label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </FormRow>
          
          <FormRow>
            <Label htmlFor="description">Description:</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </FormRow>
          
          <FormRow>
            <Label htmlFor="date">Date and Time:</Label>
            <input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </FormRow>
          
          <FormRow>
            <Label htmlFor="duration">Duration (minutes):</Label>
            <input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={5}
              required
            />
          </FormRow>
          
          <FormRow>
            <Label htmlFor="participants">Participants (comma separated):</Label>
            <input
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="John Doe, Jane Smith"
            />
          </FormRow>
          
          <FormRow>
            <Label htmlFor="notes">Notes:</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </FormRow>
          
          <div className="field-row">
            <button type="submit">Add Meeting</button>
            <button type="button" onClick={resetForm}>Reset</button>
          </div>
        </form>
      </MeetingForm>
      
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
                {meeting.notes && <div><small>Notes: {meeting.notes}</small></div>}
              </div>
              
              <MeetingActions>
                <button 
                  onClick={() => deleteMeeting(meeting.id)}
                  className="error"
                >
                  Delete
                </button>
              </MeetingActions>
            </MeetingItem>
          ))
        )}
      </MeetingList>
    </div>
  );
};

export default Meetings; 