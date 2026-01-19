import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { Reminder } from '../types';
import {
  InlineFormContainer,
  FormRow,
  Label,
  Input,
  Select,
  TextArea,
  ButtonRow,
  PrimaryButton,
  SecondaryButton
} from './shared/FormStyles';

interface ReminderEditFormProps {
  reminder: Reminder;
  onSave: (reminderId: string, updatedReminder: Partial<Reminder>) => void;
  onCancel: () => void;
}

const RecurringOptions = styled.div`
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #dfdfdf;
  background-color: #f9f9f9;
  display: ${props => props.hidden ? 'none' : 'block'};
`;

const ReminderEditForm: React.FC<ReminderEditFormProps> = ({ reminder, onSave, onCancel }) => {
  const [title, setTitle] = useState(reminder.title);
  const [description, setDescription] = useState(reminder.description);
  const [date, setDate] = useState(
    reminder.date ? new Date(reminder.date).toISOString().slice(0, 16) : ''
  );
  const [recurring, setRecurring] = useState(reminder.recurring || '');
  const [recurringSubtype, setRecurringSubtype] = useState<'dayOfMonth' | 'relativeDay'>(
    reminder.recurringConfig?.subtype || 'dayOfMonth'
  );
  const [dayOfWeek, setDayOfWeek] = useState(
    reminder.recurringConfig?.dayOfWeek?.toString() || '1'
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    reminder.recurringConfig?.dayOfMonth?.toString() || '1'
  );
  const [weekNum, setWeekNum] = useState(
    reminder.recurringConfig?.weekNum?.toString() || '1'
  );

  // Reset form when reminder changes
  useEffect(() => {
    setTitle(reminder.title);
    setDescription(reminder.description);
    setDate(
      reminder.date ? new Date(reminder.date).toISOString().slice(0, 16) : ''
    );
    setRecurring(reminder.recurring || '');
    setRecurringSubtype(reminder.recurringConfig?.subtype || 'dayOfMonth');
    setDayOfWeek(reminder.recurringConfig?.dayOfWeek?.toString() || '1');
    setDayOfMonth(reminder.recurringConfig?.dayOfMonth?.toString() || '1');
    setWeekNum(reminder.recurringConfig?.weekNum?.toString() || '1');
  }, [reminder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedReminder: Partial<Reminder> = {
      title,
      description,
      date: date ? new Date(date) : undefined,
      recurring: recurring as 'daily' | 'weekly' | 'monthly' | undefined,
    };

    // Add recurring config if applicable
    if (recurring && recurring !== '') {
      let recurringConfig: any = {};
      
      if (recurring === 'weekly') {
        recurringConfig = {
          type: 'weekly',
          dayOfWeek: parseInt(dayOfWeek, 10)
        };
      } else if (recurring === 'monthly') {
        if (recurringSubtype === 'dayOfMonth') {
          recurringConfig = {
            type: 'monthly',
            subtype: 'dayOfMonth',
            dayOfMonth: parseInt(dayOfMonth, 10)
          };
        } else {
          recurringConfig = {
            type: 'monthly',
            subtype: 'relativeDay',
            dayOfWeek: parseInt(dayOfWeek, 10),
            weekNum: parseInt(weekNum, 10)
          };
        }
      } else if (recurring === 'daily') {
        recurringConfig = {
          type: 'daily'
        };
      }
      
      updatedReminder.recurringConfig = recurringConfig;
    }
    
    onSave(reminder.id, updatedReminder);
  };

  return (
    <InlineFormContainer>
      <form onSubmit={handleSubmit}>
        <FormRow>
          <Label htmlFor="edit-title">Title:</Label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </FormRow>
        
        <FormRow>
          <Label htmlFor="edit-description">Description:</Label>
          <TextArea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </FormRow>
        
        <FormRow>
          <Label htmlFor="edit-date">Date:</Label>
          <Input
            id="edit-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required={recurring === ''}
          />
        </FormRow>
        
        <FormRow>
          <Label htmlFor="edit-recurring">Recurring:</Label>
          <Select
            id="edit-recurring"
            value={recurring}
            onChange={(e) => setRecurring(e.target.value)}
          >
            <option value="">Not recurring</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </FormRow>
        
        <RecurringOptions hidden={recurring !== 'weekly' && recurring !== 'monthly'}>
          {recurring === 'weekly' && (
            <FormRow>
              <Label htmlFor="edit-dayOfWeek">Day of Week:</Label>
              <Select
                id="edit-dayOfWeek"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
              >
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </Select>
            </FormRow>
          )}
          
          {recurring === 'monthly' && (
            <>
              <FormRow>
                <Label htmlFor="edit-recurringSubtype">Type:</Label>
                <Select
                  id="edit-recurringSubtype"
                  value={recurringSubtype}
                  onChange={(e) => setRecurringSubtype(e.target.value as 'dayOfMonth' | 'relativeDay')}
                >
                  <option value="dayOfMonth">Day of Month</option>
                  <option value="relativeDay">Relative Day</option>
                </Select>
              </FormRow>
              
              {recurringSubtype === 'dayOfMonth' ? (
                <FormRow>
                  <Label htmlFor="edit-dayOfMonth">Day of Month:</Label>
                  <Select
                    id="edit-dayOfMonth"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day.toString()}>{day}</option>
                    ))}
                  </Select>
                </FormRow>
              ) : (
                <>
                  <FormRow>
                    <Label htmlFor="edit-weekNum">Week:</Label>
                    <Select
                      id="edit-weekNum"
                      value={weekNum}
                      onChange={(e) => setWeekNum(e.target.value)}
                    >
                      <option value="1">First</option>
                      <option value="2">Second</option>
                      <option value="3">Third</option>
                      <option value="4">Fourth</option>
                      <option value="-1">Last</option>
                    </Select>
                  </FormRow>
                  
                  <FormRow>
                    <Label htmlFor="edit-relDayOfWeek">Day:</Label>
                    <Select
                      id="edit-relDayOfWeek"
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value)}
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </Select>
                  </FormRow>
                </>
              )}
            </>
          )}
        </RecurringOptions>
        
        <ButtonRow>
          <PrimaryButton type="submit">Save Changes</PrimaryButton>
          <SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton>
        </ButtonRow>
      </form>
    </InlineFormContainer>
  );
};

export default ReminderEditForm; 