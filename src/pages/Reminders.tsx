import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import styled from 'styled-components';
import { format, isSameDay } from 'date-fns';
import LinkifyText from '../components/shared/LinkifyText';
import {
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
    content: '🔔';
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
`;

const CardBody = styled.div`
  padding: 0;
`;

const ReminderItem = styled.div<{ isToday?: boolean; converted?: boolean }>`
  padding: 15px;
  border-bottom: 1px solid #e5e5e5;
  background: ${props => {
    if (props.converted) return '#f0f0ff';
    if (props.isToday) return '#f0fff4';
    return '#fff';
  }};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${props => {
      if (props.converted) return '#e8e8ff';
      if (props.isToday) return '#e0ffe8';
      return '#f0f4ff';
    }};
  }
`;

const ReminderHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const Checkbox = styled.button<{ checked: boolean; disabled?: boolean }>`
  width: 20px;
  height: 20px;
  min-width: 20px;
  border: 2px solid ${props => props.checked ? '#28a745' : '#aaa'};
  background: ${props => props.checked ? '#28a745' : '#fff'};
  border-radius: 3px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:after {
    content: '${props => props.checked ? '✓' : ''}';
    color: white;
    font-size: 14px;
    font-weight: bold;
  }
`;

const ReminderContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ReminderTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const Badge = styled.span<{ variant?: 'today' | 'converted' | 'recurring' }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.variant) {
      case 'today': return '#28a745';
      case 'converted': return '#6f42c1';
      case 'recurring': return '#17a2b8';
      default: return '#6c757d';
    }
  }};
  color: white;
`;

const ReminderDescription = styled.p`
  font-size: 13px;
  color: #555;
  margin: 0 0 8px 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ReminderMeta = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 8px;
`;

const ReminderActions = styled.div`
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
  
  &:disabled {
    background: #adb5bd;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #888;
  font-size: 14px;
`;

const ConditionalWrapper = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'block' : 'none'};
`;

const PreviewText = styled.div`
  margin-bottom: 15px;
  padding: 10px;
  background: #f0f4ff;
  border-left: 3px solid #007bff;
  font-size: 13px;
  color: #555;
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
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [recurring, setRecurring] = useState<'' | 'daily' | 'weekly' | 'monthly'>('');
  const [weeklyDay, setWeeklyDay] = useState<number>(1);
  const [monthlyType, setMonthlyType] = useState<'dayOfMonth' | 'relativeDay'>('dayOfMonth');
  const [monthlyDay, setMonthlyDay] = useState<number>(1);
  const [monthlyWeekNum, setMonthlyWeekNum] = useState<number>(1);
  const [monthlyWeekDay, setMonthlyWeekDay] = useState<number>(1);
  const [showDateField, setShowDateField] = useState(true);
  const [showRelativeDateFields, setShowRelativeDateFields] = useState(false);
  
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
  
  const isReminderDueToday = (reminder: any) => {
    if (!reminder.recurring) {
      const reminderDate = new Date(reminder.date);
      const today = new Date(currentDate);
      return reminderDate.getFullYear() === today.getFullYear() &&
             reminderDate.getMonth() === today.getMonth() &&
             reminderDate.getDate() === today.getDate();
    }
    
    const now = new Date(currentDate);
    
    if (reminder.recurring === 'daily') return true;
    
    if (reminder.recurring === 'weekly' && reminder.recurringConfig) {
      return now.getDay() === reminder.recurringConfig.dayOfWeek;
    }
    
    if (reminder.recurring === 'monthly' && reminder.recurringConfig) {
      if (reminder.recurringConfig.subtype === 'dayOfMonth') {
        return now.getDate() === reminder.recurringConfig.dayOfMonth;
      } else {
        const weekNum = reminder.recurringConfig.weekNum!;
        const dayOfWeek = reminder.recurringConfig.dayOfWeek!;
        let targetDate;
        
        if (weekNum === -1) {
          const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          let day = lastDayOfMonth.getDate();
          while (new Date(now.getFullYear(), now.getMonth(), day).getDay() !== dayOfWeek) {
            day--;
          }
          targetDate = new Date(now.getFullYear(), now.getMonth(), day);
        } else {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const firstDayOfWeek = firstDay.getDay();
          let dayOffset = dayOfWeek - firstDayOfWeek;
          if (dayOffset < 0) dayOffset += 7;
          const day = 1 + dayOffset + (weekNum - 1) * 7;
          targetDate = new Date(now.getFullYear(), now.getMonth(), day);
        }
        
        return isSameDay(now, targetDate);
      }
    }
    
    return false;
  };
  
  const getDateString = () => {
    if (date && time) return `${date}T${time}`;
    return '';
  };
  
  const getRelativeDateString = () => {
    if (recurring === 'daily') return '🔄 Repeats every day';
    if (recurring === 'weekly') {
      return `🔄 Every ${daysOfWeek.find(d => d.value === weeklyDay)?.label || 'Monday'}`;
    } else if (recurring === 'monthly' && monthlyType === 'dayOfMonth') {
      return `🔄 Day ${monthlyDay} of every month`;
    } else if (recurring === 'monthly' && monthlyType === 'relativeDay') {
      const weekNum = weekNumbers.find(w => w.value === monthlyWeekNum)?.label || 'First';
      const weekDay = daysOfWeek.find(d => d.value === monthlyWeekDay)?.label || 'Monday';
      return `🔄 ${weekNum} ${weekDay} of every month`;
    }
    return '';
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const reminderData: any = {
      title,
      description,
      completed: false,
      recurring: recurring || undefined,
    };
    
    if (recurring === '' && getDateString()) {
      reminderData.date = new Date(getDateString());
    } else if (recurring === 'daily') {
      if (time) {
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        now.setHours(hours, minutes, 0, 0);
        reminderData.date = now;
      } else {
        reminderData.date = new Date();
      }
    } else if (recurring === 'weekly') {
      reminderData.recurringConfig = {
        type: 'weekly',
        dayOfWeek: weeklyDay,
        time: time || undefined
      };
      
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
        
        const now = new Date();
        const nextOccurrence = new Date(now.getFullYear(), now.getMonth(), monthlyDay);
        if (nextOccurrence < now) {
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
        }
        
        if (time) {
          const [hours, minutes] = time.split(':').map(Number);
          nextOccurrence.setHours(hours, minutes, 0, 0);
        }
        
        reminderData.date = nextOccurrence;
      } else {
        reminderData.recurringConfig = {
          type: 'monthly',
          subtype: 'relativeDay',
          weekNum: monthlyWeekNum,
          dayOfWeek: monthlyWeekDay,
          time: time || undefined
        };
        
        const now = new Date();
        let month = now.getMonth();
        let year = now.getFullYear();
        
        const getNthDayOfWeekInMonth = (year: number, month: number, dayOfWeek: number, n: number) => {
          const firstDay = new Date(year, month, 1);
          const firstDayOfWeek = firstDay.getDay();
          let dayOffset = dayOfWeek - firstDayOfWeek;
          if (dayOffset < 0) dayOffset += 7;
          
          if (n === -1) {
            const lastDay = new Date(year, month + 1, 0);
            const lastDayOfMonth = lastDay.getDate();
            const lastDayOfWeek = lastDay.getDay();
            let offset = dayOfWeek - lastDayOfWeek;
            if (offset > 0) offset -= 7;
            return new Date(year, month, lastDayOfMonth + offset);
          }
          
          const day = 1 + dayOffset + (n - 1) * 7;
          return new Date(year, month, day);
        };
        
        let nextOccurrence = getNthDayOfWeekInMonth(year, month, monthlyWeekDay, monthlyWeekNum);
        
        if (nextOccurrence < now) {
          month = (month + 1) % 12;
          if (month === 0) year++;
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
  
  const formatRecurringDisplay = (reminder: any) => {
    if (!reminder.recurring) return '';
    
    if (reminder.recurring === 'daily') return 'Repeats daily';
    
    if (reminder.recurring === 'weekly' && reminder.recurringConfig) {
      const day = daysOfWeek.find(d => d.value === reminder.recurringConfig.dayOfWeek)?.label || 'Monday';
      return `Every ${day}`;
    }
    
    if (reminder.recurring === 'monthly' && reminder.recurringConfig) {
      if (reminder.recurringConfig.subtype === 'dayOfMonth') {
        return `Day ${reminder.recurringConfig.dayOfMonth} monthly`;
      } else {
        const weekNum = weekNumbers.find(w => w.value === reminder.recurringConfig.weekNum)?.label || 'First';
        const weekDay = daysOfWeek.find(d => d.value === reminder.recurringConfig.dayOfWeek)?.label || 'Monday';
        return `${weekNum} ${weekDay} monthly`;
      }
    }
    
    return reminder.recurring;
  };
  
  return (
    <PageContainer>
      <PageTitle>Reminders</PageTitle>
      
      <Card>
        <CardHeader color="linear-gradient(180deg, #495057, #343a40)">
          ➕ Add New Reminder
        </CardHeader>
        <div style={{ padding: 15 }}>
          <form onSubmit={handleSubmit}>
            <FormRow>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reminder title..."
                required
              />
            </FormRow>
            
            <FormRow>
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={2}
              />
            </FormRow>
            
            <FormRowHorizontal>
              <FormRow>
                <Label htmlFor="recurring">Repeat</Label>
                <Select
                  id="recurring"
                  value={recurring}
                  onChange={(e) => setRecurring(e.target.value as '' | 'daily' | 'weekly' | 'monthly')}
                >
                  <option value="">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </FormRow>
              
              <FormRow>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </FormRow>
            </FormRowHorizontal>
            
            <ConditionalWrapper show={showDateField}>
              <FormRow>
                <Label htmlFor="date">Date</Label>
                <DateInput
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required={recurring === ''}
                />
              </FormRow>
            </ConditionalWrapper>
            
            <ConditionalWrapper show={showRelativeDateFields && recurring === 'weekly'}>
              <FormRow>
                <Label htmlFor="weeklyDay">Day of Week</Label>
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
            
            <ConditionalWrapper show={showRelativeDateFields && recurring === 'monthly'}>
              <FormRow>
                <Label htmlFor="monthlyType">Monthly Type</Label>
                <Select
                  id="monthlyType"
                  value={monthlyType}
                  onChange={(e) => setMonthlyType(e.target.value as 'dayOfMonth' | 'relativeDay')}
                >
                  <option value="dayOfMonth">Same day each month</option>
                  <option value="relativeDay">Specific week/day</option>
                </Select>
              </FormRow>
              
              <ConditionalWrapper show={monthlyType === 'dayOfMonth'}>
                <FormRow>
                  <Label htmlFor="monthlyDay">Day of Month</Label>
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
              
              <ConditionalWrapper show={monthlyType === 'relativeDay'}>
                <FormRowHorizontal>
                  <FormRow>
                    <Label htmlFor="monthlyWeekNum">Week</Label>
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
                    <Label htmlFor="monthlyWeekDay">Day</Label>
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
            
            {recurring && <PreviewText>{getRelativeDateString()}</PreviewText>}
            
            <ButtonRow>
              <PrimaryButton type="submit">+ Add Reminder</PrimaryButton>
              <SecondaryButton type="button" onClick={resetForm}>Clear</SecondaryButton>
            </ButtonRow>
          </form>
        </div>
      </Card>
      
      <Card>
        <CardHeader>
          🔔 Active Reminders ({reminders.length})
        </CardHeader>
        <CardBody>
          {reminders.length === 0 ? (
            <EmptyState>No reminders set</EmptyState>
          ) : (
            reminders.map(reminder => {
              const isDueToday = isReminderDueToday(reminder);
              
              const isCompletedToday = reminder.recurring
                ? (reminder.completedInstances || []).some(d => {
                    const completedDate = new Date(d);
                    const today = new Date(currentDate);
                    today.setHours(0, 0, 0, 0);
                    completedDate.setHours(0, 0, 0, 0);
                    return completedDate.getTime() === today.getTime();
                  })
                : reminder.completed;
              
              const isTaskCreatedToday = reminder.recurring
                ? (reminder.convertedToTaskDates || []).some(d => {
                    const convertedDate = new Date(d);
                    const today = new Date(currentDate);
                    today.setHours(0, 0, 0, 0);
                    convertedDate.setHours(0, 0, 0, 0);
                    return convertedDate.getTime() === today.getTime();
                  })
                : reminder.convertedToTask && isDueToday;
              
              return (
                <ReminderItem 
                  key={reminder.id}
                  isToday={isDueToday && !isCompletedToday && !isTaskCreatedToday}
                  converted={isTaskCreatedToday}
                >
                  <ReminderHeader>
                    <Checkbox
                      checked={isCompletedToday}
                      onClick={() => toggleReminderCompletion(reminder.id)}
                      disabled={isTaskCreatedToday}
                    />
                    <ReminderContent>
                      <ReminderTitle>
                        {reminder.title}
                        {isDueToday && !isCompletedToday && !isTaskCreatedToday && (
                          <Badge variant="today">TODAY</Badge>
                        )}
                        {isTaskCreatedToday && (
                          <Badge variant="converted">TASK CREATED</Badge>
                        )}
                        {reminder.recurring && (
                          <Badge variant="recurring">{reminder.recurring}</Badge>
                        )}
                      </ReminderTitle>
                      {reminder.description && (
                        <ReminderDescription>
                          <LinkifyText text={reminder.description} />
                        </ReminderDescription>
                      )}
                      <ReminderMeta>
                        {!reminder.recurring && `📅 ${format(new Date(reminder.date), 'MMM d, yyyy h:mm a')}`}
                        {reminder.recurring && `🔄 ${formatRecurringDisplay(reminder)}`}
                      </ReminderMeta>
                    </ReminderContent>
                    <ReminderActions>
                      {isDueToday && !isTaskCreatedToday && !isCompletedToday && (
                        <Button onClick={() => convertReminderToTask(reminder.id)}>
                          + Task
                        </Button>
                      )}
                      <Button variant="danger" onClick={() => deleteReminder(reminder.id)}>
                        ✕
                      </Button>
                    </ReminderActions>
                  </ReminderHeader>
                </ReminderItem>
              );
            })
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default Reminders;
