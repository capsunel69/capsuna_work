import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styled from 'styled-components';
import { format } from 'date-fns';

const RemindersContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const ReminderForm = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
  padding: 16px;
  margin-bottom: 16px;
`;

const ReminderList = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
`;

const ReminderItem = styled.div<{ completed: boolean }>`
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

const ReminderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const NoReminders = styled.div`
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

const ReminderTitle = styled.div`
  font-weight: bold;
`;

const ReminderInfo = styled.div`
  font-size: 0.8em;
  color: #888;
`;

const Reminders: React.FC = () => {
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminderCompletion } = useAppContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [recurring, setRecurring] = useState<'' | 'daily' | 'weekly' | 'monthly'>('');
  
  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setRecurring('');
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addReminder({
      title,
      description,
      date: new Date(date),
      completed: false,
      recurring: recurring || undefined,
    });
    
    resetForm();
  };
  
  return (
    <div>
      <h2>Reminders</h2>
      
      <ReminderForm>
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
            <Label htmlFor="recurring">Recurring:</Label>
            <select
              id="recurring"
              value={recurring}
              onChange={(e) => setRecurring(e.target.value as '' | 'daily' | 'weekly' | 'monthly')}
            >
              <option value="">Not Recurring</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </FormRow>
          
          <div className="field-row">
            <button type="submit">Add Reminder</button>
            <button type="button" onClick={resetForm}>Reset</button>
          </div>
        </form>
      </ReminderForm>
      
      <ReminderList>
        {reminders.length === 0 ? (
          <NoReminders>No reminders yet. Add one above!</NoReminders>
        ) : (
          reminders.map(reminder => (
            <ReminderItem key={reminder.id} completed={reminder.completed}>
              <input
                type="checkbox"
                checked={reminder.completed}
                onChange={() => toggleReminderCompletion(reminder.id)}
              />
              
              <div>
                <ReminderTitle>{reminder.title}</ReminderTitle>
                {reminder.description && <div>{reminder.description}</div>}
                <ReminderInfo>
                  Due: {format(new Date(reminder.date), 'MMM d, yyyy h:mm a')}
                  {reminder.recurring && ` • Recurring: ${reminder.recurring}`}
                </ReminderInfo>
              </div>
              
              <ReminderActions>
                <button 
                  onClick={() => deleteReminder(reminder.id)}
                  className="error"
                >
                  Delete
                </button>
              </ReminderActions>
            </ReminderItem>
          ))
        )}
      </ReminderList>
    </div>
  );
};

export default Reminders; 