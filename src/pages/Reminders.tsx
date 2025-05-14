import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import styled from 'styled-components';
import { format, isSameDay } from 'date-fns';
import LinkifyText from '../components/shared/LinkifyText';
import {
  FormContainer,
  FormRow,
  FormRowHorizontal,
  Label,
  Input,
  DateInput,
  Select,
  TextArea,
  ButtonRow,
  PrimaryButton,
  SecondaryButton
} from '../components/shared/FormStyles';

const ReminderList = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888, 0 3px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background-color: #fff;
`;

const ReminderItem = styled.div<{ completed: boolean; convertedToTask?: boolean; isToday?: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid #dfdfdf;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  ${({ completed }) => completed && 'text-decoration: line-through; color: #888;'}
  ${({ convertedToTask }) => convertedToTask && 'background-color: #f0f9ff;'}
  ${({ isToday }) => isToday && 'background-color: #f0fff4;'}
  
  &:last-child {
    border-bottom: none;
  }
`;

const NoReminders = styled.div`
  padding: 32px;
  text-align: center;
  color: #888;
  font-size: 1.1rem;
`;

const ReminderTitle = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
`;

const ReminderInfo = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
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

const ConvertButton = styled.button`
  background: linear-gradient(to bottom, #4f94ea, #3a7bd5);
  color: white;
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #2c5ea9;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to bottom, #5ca0ff, #4485e6);
  }
  
  &:active {
    background: #3a7bd5;
  }
  
  &:disabled {
    background: #cccccc;
    border-color: #bbbbbb;
    color: #888888;
    cursor: not-allowed;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  gap: 6px;
  margin-left: 8px;
`;

const Tag = styled.span<{ type: 'today' | 'converted' }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
  color: white;
  background-color: ${props => props.type === 'today' ? '#4299e1' : '#805ad5'};
`;

const ConditionalWrapper = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'block' : 'none'};
`;

const ReminderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const weekNumbers = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: -1, label: 'Last' }
];

const Reminders: React.FC = () => {
  const { 
    reminders, 
    addReminder, 
    deleteReminder, 
    toggleReminderCompletion,
    convertReminderToTask,
    currentDate 
  } = useAppContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [recurring, setRecurring] = useState<'' | 'daily' | 'weekly' | 'monthly'>('');
  
  // Weekly recurring options
  const [weeklyDay, setWeeklyDay] = useState<number>(1); // Monday default
  
  // Monthly recurring options
  const [monthlyType, setMonthlyType] = useState<'dayOfMonth' | 'relativeDay'>('dayOfMonth');
  const [monthlyDay, setMonthlyDay] = useState<number>(1);
  const [monthlyWeekNum, setMonthlyWeekNum] = useState<number>(1); // First
  const [monthlyWeekDay, setMonthlyWeekDay] = useState<number>(1); // Monday
  
  // Handle showing/hiding date field based on recurring selection
  const [showDateField, setShowDateField] = useState(true);
  const [showRelativeDateFields, setShowRelativeDateFields] = useState(false);
  
  // Update visibility of fields based on recurring selection
  useEffect(() => {
    if (recurring === '') {
      setShowDateField(true);
      setShowRelativeDateFields(false);
    } else if (recurring === 'daily') {
      setShowDateField(false);
      setShowRelativeDateFields(false);
    } else if (recurring === 'weekly') {
      setShowDateField(false);
      setShowRelativeDateFields(true);
    } else if (recurring === 'monthly') {
      setShowDateField(false);
      setShowRelativeDateFields(true);
    }
  }, [recurring]);
  
  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setRecurring('');
    setWeeklyDay(1);
    setMonthlyType('dayOfMonth');
    setMonthlyDay(1);
    setMonthlyWeekNum(1);
    setMonthlyWeekDay(1);
  };
  
  // Check if a reminder is due today
  const isReminderDueToday = (reminder: any) => {
    if (!reminder.recurring) {
      const reminderDate = new Date(reminder.date);
      const today = new Date(currentDate);
      return reminderDate.getFullYear() === today.getFullYear() &&
             reminderDate.getMonth() === today.getMonth() &&
             reminderDate.getDate() === today.getDate();
    }
    
    // For recurring reminders, check based on the recurrence pattern
    const now = new Date(currentDate);
    
    if (reminder.recurring === 'daily') {
      return true; // Daily reminders are due every day
    }
    
    if (reminder.recurring === 'weekly' && reminder.recurringConfig) {
      return now.getDay() === reminder.recurringConfig.dayOfWeek;
    }
    
    if (reminder.recurring === 'monthly' && reminder.recurringConfig) {
      if (reminder.recurringConfig.subtype === 'dayOfMonth') {
        return now.getDate() === reminder.recurringConfig.dayOfMonth;
      } else {
        // Handle relative day logic
        const weekNum = reminder.recurringConfig.weekNum!;
        const dayOfWeek = reminder.recurringConfig.dayOfWeek!;
        
        // Calculate the target date for this month
        let targetDate;
        
        if (weekNum === -1) {
          // Last occurrence
          const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          let day = lastDayOfMonth.getDate();
          
          while (new Date(now.getFullYear(), now.getMonth(), day).getDay() !== dayOfWeek) {
            day--;
          }
          
          targetDate = new Date(now.getFullYear(), now.getMonth(), day);
        } else {
          // Calculate first occurrence of the day in the month
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const firstDayOfWeek = firstDay.getDay();
          let dayOffset = dayOfWeek - firstDayOfWeek;
          if (dayOffset < 0) dayOffset += 7;
          
          // Calculate the date of the nth occurrence
          const day = 1 + dayOffset + (weekNum - 1) * 7;
          targetDate = new Date(now.getFullYear(), now.getMonth(), day);
        }
        
        return isSameDay(now, targetDate);
      }
    }
    
    return false;
  };
  
  // Generate full date string from date and time inputs
  const getDateString = () => {
    if (date && time) {
      return `${date}T${time}`;
    }
    return '';
  };
  
  // Create a relative date description for display
  const getRelativeDateString = () => {
    if (recurring === 'weekly') {
      return `Every ${daysOfWeek.find(d => d.value === weeklyDay)?.label || 'Monday'}`;
    } else if (recurring === 'monthly' && monthlyType === 'dayOfMonth') {
      return `Day ${monthlyDay} of every month`;
    } else if (recurring === 'monthly' && monthlyType === 'relativeDay') {
      const weekNum = weekNumbers.find(w => w.value === monthlyWeekNum)?.label || 'First';
      const weekDay = daysOfWeek.find(d => d.value === monthlyWeekDay)?.label || 'Monday';
      return `${weekNum} ${weekDay} of every month`;
    }
    return '';
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const reminderData: any = {
      title,
      description,
      completed: false,
      recurring: recurring || undefined,
    };
    
    // Add date if provided or required
    if (recurring === '' && getDateString()) {
      reminderData.date = new Date(getDateString());
    } else if (recurring === 'daily') {
      // For daily, we don't need a specific date
      if (time) {
        // If time is provided, use current date with that time
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        now.setHours(hours, minutes, 0, 0);
        reminderData.date = now;
      } else {
        // No time provided, use current time
        reminderData.date = new Date();
      }
    } else if (recurring === 'weekly') {
      reminderData.recurringConfig = {
        type: 'weekly',
        dayOfWeek: weeklyDay,
        time: time || undefined
      };
      
      // Set a date to match the first occurrence
      const now = new Date();
      const currentDay = now.getDay();
      const daysToAdd = (weeklyDay - currentDay + 7) % 7;
      const nextOccurrence = new Date(now);
      nextOccurrence.setDate(now.getDate() + daysToAdd);
      
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        nextOccurrence.setHours(hours, minutes, 0, 0);
      }
      
      reminderData.date = nextOccurrence;
    } else if (recurring === 'monthly') {
      if (monthlyType === 'dayOfMonth') {
        reminderData.recurringConfig = {
          type: 'monthly',
          subtype: 'dayOfMonth',
          dayOfMonth: monthlyDay,
          time: time || undefined
        };
        
        // Set a date to match the first occurrence
        const now = new Date();
        const nextOccurrence = new Date(now.getFullYear(), now.getMonth(), monthlyDay);
        
        // If the day has already passed this month, move to next month
        if (nextOccurrence < now) {
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
        }
        
        if (time) {
          const [hours, minutes] = time.split(':').map(Number);
          nextOccurrence.setHours(hours, minutes, 0, 0);
        }
        
        reminderData.date = nextOccurrence;
      } else {
        // relativeDay
        reminderData.recurringConfig = {
          type: 'monthly',
          subtype: 'relativeDay',
          weekNum: monthlyWeekNum,
          dayOfWeek: monthlyWeekDay,
          time: time || undefined
        };
        
        // Calculate the first occurrence
        const now = new Date();
        let month = now.getMonth();
        let year = now.getFullYear();
        
        // Function to calculate the nth day of week in a month
        const getNthDayOfWeekInMonth = (year: number, month: number, dayOfWeek: number, n: number) => {
          const firstDay = new Date(year, month, 1);
          const firstDayOfWeek = firstDay.getDay();
          let dayOffset = dayOfWeek - firstDayOfWeek;
          if (dayOffset < 0) dayOffset += 7;
          
          // For last (-1), we need a different calculation
          if (n === -1) {
            const lastDay = new Date(year, month + 1, 0);
            const lastDayOfMonth = lastDay.getDate();
            const lastDayOfWeek = lastDay.getDay();
            let offset = dayOfWeek - lastDayOfWeek;
            if (offset > 0) offset -= 7;
            return new Date(year, month, lastDayOfMonth + offset);
          }
          
          // Calculate the date of the nth occurrence
          const day = 1 + dayOffset + (n - 1) * 7;
          return new Date(year, month, day);
        };
        
        let nextOccurrence = getNthDayOfWeekInMonth(year, month, monthlyWeekDay, monthlyWeekNum);
        
        // If the day has already passed this month, move to next month
        if (nextOccurrence < now) {
          month = (month + 1) % 12;
          if (month === 0) year++; // Move to next year if needed
          nextOccurrence = getNthDayOfWeekInMonth(year, month, monthlyWeekDay, monthlyWeekNum);
        }
        
        if (time) {
          const [hours, minutes] = time.split(':').map(Number);
          nextOccurrence.setHours(hours, minutes, 0, 0);
        }
        
        reminderData.date = nextOccurrence;
      }
    }
    
    addReminder(reminderData);
    resetForm();
  };
  
  // Format the relative date for display in the reminders list
  const formatRecurringDisplay = (reminder: any) => {
    if (!reminder.recurring) return '';
    
    if (reminder.recurring === 'daily') {
      return '• Repeats daily';
    }
    
    if (reminder.recurring === 'weekly' && reminder.recurringConfig) {
      const day = daysOfWeek.find(d => d.value === reminder.recurringConfig.dayOfWeek)?.label || 'Monday';
      const timeStr = reminder.recurringConfig.time ? 
        ` at ${reminder.recurringConfig.time}` : '';
      return `• Repeats every ${day}${timeStr}`;
    }
    
    if (reminder.recurring === 'monthly' && reminder.recurringConfig) {
      if (reminder.recurringConfig.subtype === 'dayOfMonth') {
        const day = reminder.recurringConfig.dayOfMonth;
        const timeStr = reminder.recurringConfig.time ? 
          ` at ${reminder.recurringConfig.time}` : '';
        return `• Repeats on day ${day} of each month${timeStr}`;
      } else {
        const weekNum = weekNumbers.find(w => w.value === reminder.recurringConfig.weekNum)?.label || 'First';
        const weekDay = daysOfWeek.find(d => d.value === reminder.recurringConfig.dayOfWeek)?.label || 'Monday';
        const timeStr = reminder.recurringConfig.time ? 
          ` at ${reminder.recurringConfig.time}` : '';
        return `• Repeats on the ${weekNum} ${weekDay} of each month${timeStr}`;
      }
    }
    
    return `• Recurring: ${reminder.recurring}`;
  };
  
  // Handle converting reminder to task
  const handleConvertToTask = (reminderId: string) => {
    convertReminderToTask(reminderId);
  };
  
  return (
    <div>
      <PageTitle>Reminders</PageTitle>
      
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
              <Label htmlFor="recurring">Recurring:</Label>
              <Select
                id="recurring"
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as '' | 'daily' | 'weekly' | 'monthly')}
              >
                <option value="">Not Recurring</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </FormRow>
            
            <FormRow>
              <Label htmlFor="time">Time:</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </FormRow>
          </FormRowHorizontal>
          
          {/* Conditional Date Field */}
          <ConditionalWrapper show={showDateField}>
            <FormRow>
              <Label htmlFor="date">Date:</Label>
              <DateInput
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required={recurring === ''}
              />
            </FormRow>
          </ConditionalWrapper>
          
          {/* Weekly Recurring Options */}
          <ConditionalWrapper show={showRelativeDateFields && recurring === 'weekly'}>
            <FormRow>
              <Label htmlFor="weeklyDay">Day of the Week:</Label>
              <Select
                id="weeklyDay"
                value={weeklyDay}
                onChange={(e) => setWeeklyDay(Number(e.target.value))}
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </Select>
            </FormRow>
          </ConditionalWrapper>
          
          {/* Monthly Recurring Options */}
          <ConditionalWrapper show={showRelativeDateFields && recurring === 'monthly'}>
            <FormRow>
              <Label htmlFor="monthlyType">Monthly Recurrence Type:</Label>
              <Select
                id="monthlyType"
                value={monthlyType}
                onChange={(e) => setMonthlyType(e.target.value as 'dayOfMonth' | 'relativeDay')}
              >
                <option value="dayOfMonth">Same day each month</option>
                <option value="relativeDay">Specific week/day each month</option>
              </Select>
            </FormRow>
            
            {/* Day of Month option */}
            <ConditionalWrapper show={monthlyType === 'dayOfMonth'}>
              <FormRow>
                <Label htmlFor="monthlyDay">Day of Month:</Label>
                <Select
                  id="monthlyDay"
                  value={monthlyDay}
                  onChange={(e) => setMonthlyDay(Number(e.target.value))}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </Select>
              </FormRow>
            </ConditionalWrapper>
            
            {/* Relative Day option (e.g., First Monday of the month) */}
            <ConditionalWrapper show={monthlyType === 'relativeDay'}>
              <FormRowHorizontal>
                <FormRow>
                  <Label htmlFor="monthlyWeekNum">Week:</Label>
                  <Select
                    id="monthlyWeekNum"
                    value={monthlyWeekNum}
                    onChange={(e) => setMonthlyWeekNum(Number(e.target.value))}
                  >
                    {weekNumbers.map(week => (
                      <option key={week.value} value={week.value}>{week.label}</option>
                    ))}
                  </Select>
                </FormRow>
                
                <FormRow>
                  <Label htmlFor="monthlyWeekDay">Day:</Label>
                  <Select
                    id="monthlyWeekDay"
                    value={monthlyWeekDay}
                    onChange={(e) => setMonthlyWeekDay(Number(e.target.value))}
                  >
                    {daysOfWeek.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </Select>
                </FormRow>
              </FormRowHorizontal>
            </ConditionalWrapper>
          </ConditionalWrapper>
          
          {/* Preview of recurrence pattern */}
          {recurring && (
            <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#666' }}>
              {getRelativeDateString()}
            </div>
          )}
          
          <ButtonRow>
            <PrimaryButton type="submit">Add Reminder</PrimaryButton>
            <SecondaryButton type="button" onClick={resetForm}>Reset</SecondaryButton>
          </ButtonRow>
        </form>
      </FormContainer>
      
      <ReminderList>
        {reminders.length === 0 ? (
          <NoReminders>No reminders found.</NoReminders>
        ) : (
          reminders.map(reminder => {
            const isDueToday = isReminderDueToday(reminder);
            
            // Check if reminder was completed today
            const isCompletedToday = reminder.recurring
              ? (reminder.completedInstances || []).some(date => {
                  const completedDate = new Date(date);
                  const today = new Date(currentDate);
                  today.setHours(0, 0, 0, 0);
                  completedDate.setHours(0, 0, 0, 0);
                  return completedDate.getTime() === today.getTime();
                })
              : reminder.completed;
            
            // Check if task was created today for recurring reminders
            const isTaskCreatedToday = reminder.recurring
              ? (reminder.convertedToTaskDates || []).some(date => {
                  const convertedDate = new Date(date);
                  const today = new Date(currentDate);
                  today.setHours(0, 0, 0, 0);
                  convertedDate.setHours(0, 0, 0, 0);
                  return convertedDate.getTime() === today.getTime();
                })
              : reminder.convertedToTask && isDueToday;
            
            return (
              <ReminderItem 
                key={reminder.id}
                completed={isCompletedToday}
                convertedToTask={isTaskCreatedToday}
                isToday={isDueToday}
              >
                <input
                  type="checkbox"
                  checked={isCompletedToday}
                  onChange={() => toggleReminderCompletion(reminder.id)}
                  disabled={isTaskCreatedToday}
                />
                
                <div>
                  <ReminderTitle>
                    {reminder.title}
                    <TagsContainer>
                      {isDueToday && (
                        <Tag type="today">TODAY</Tag>
                      )}
                      {isTaskCreatedToday && (
                        <Tag type="converted">TASK CREATED</Tag>
                      )}
                    </TagsContainer>
                  </ReminderTitle>
                  {reminder.description && (
                    <div>
                      <LinkifyText text={reminder.description} />
                    </div>
                  )}
                  <ReminderInfo>
                    {!reminder.recurring && `Due: ${format(new Date(reminder.date), 'MMM d, yyyy h:mm a')}`}
                    {reminder.recurring && formatRecurringDisplay(reminder)}
                  </ReminderInfo>
                </div>
                
                <ReminderActions>
                  {isDueToday && !isTaskCreatedToday && !isCompletedToday && (
                    <ConvertButton 
                      onClick={() => handleConvertToTask(reminder.id)}
                    >
                      Add as Task
                    </ConvertButton>
                  )}
                  <DeleteButton 
                    onClick={() => deleteReminder(reminder.id)}
                  >
                    Delete
                  </DeleteButton>
                </ReminderActions>
              </ReminderItem>
            );
          })
        )}
      </ReminderList>
    </div>
  );
};

export default Reminders; 