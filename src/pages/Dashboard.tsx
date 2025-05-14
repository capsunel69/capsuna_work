import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { format, isPast, isToday, isSameDay } from 'date-fns';
import styled from 'styled-components';
import { OverdueTag } from '../components/shared/TagStyles';
import LoadingState from '../components/shared/LoadingState';
import ErrorMessage from '../components/shared/ErrorMessage';

const PageTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 20px;
  font-weight: bold;
  color: #333;
`;

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
`;

const DashboardCard = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888, 0 3px 8px rgba(0, 0, 0, 0.1);
  padding: 18px;
  margin-bottom: 20px;
  border-radius: 4px;
  background-color: #fff;
`;

const DashboardTitle = styled.div`
  background: linear-gradient(90deg, #000080, #1084d0);
  color: white;
  padding: 8px 12px;
  margin-bottom: 18px;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: 3px;
`;

const DashboardList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 230px;
  overflow-y: auto;
  font-size: 1.05rem;
`;

const ListItem = styled.li`
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #dfdfdf;
  &:last-child {
    border-bottom: none;
  }
`;

const ReminderItem = styled.li`
  padding: 8px 0;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
  border-bottom: 1px solid #dfdfdf;
  &:last-child {
    border-bottom: none;
  }
`;

const ConvertButton = styled.button`
  background: linear-gradient(to bottom, #4f94ea, #3a7bd5);
  color: white;
  border: 1px solid #2c5ea9;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 0.85rem;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to bottom, #5ca0ff, #4485e6);
  }
  
  &:active {
    background: #3a7bd5;
  }
`;

const TodayTag = styled.span`
  display: inline-block;
  padding: 2px 6px;
  background-color: #4299e1;
  color: white;
  border-radius: 3px;
  font-size: 0.75rem;
  margin-left: 8px;
`;

const NoItems = styled.div`
  color: #888;
  text-align: center;
  padding: 20px;
  font-size: 1.05rem;
`;

const CardContent = styled.div`
  font-size: 1.05rem;
  line-height: 1.6;
`;

const ViewAllLink = styled(Link)`
  float: right;
  color: white;
  font-size: 0.9rem;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const CompletedCheckbox = styled.input.attrs({ type: 'checkbox' })`
  margin-right: 8px;
`;

const Dashboard: React.FC = () => {
  const { 
    tasks, 
    meetings, 
    reminders, 
    currentTimer, 
    activeTaskId,
    isLoading,
    error,
    convertReminderToTask,
    toggleTaskCompletion
  } = useAppContext();
  
  if (isLoading) {
    return <LoadingState message="Loading your dashboard..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  // Get incomplete tasks, upcoming meetings, and active reminders
  const incompleteTasks = tasks.filter(task => !task.completed).slice(0, 5);
  const completedTasks = tasks.filter(task => task.completed).slice(0, 5);
  const upcomingMeetings = meetings
    .filter(meeting => new Date(meeting.date) > new Date() && !meeting.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  
  // Get today's reminders and other active reminders
  const todayReminders = reminders.filter(reminder => {
    if (reminder.completed || reminder.convertedToTask) return false;
    
    // For non-recurring reminders, check if date is today
    if (!reminder.recurring) {
      return isToday(new Date(reminder.date));
    }
    
    // For recurring reminders
    const now = new Date();
    
    if (reminder.recurring === 'daily') {
      return true; // Daily reminders are due every day
    }
    
    if (reminder.recurring === 'weekly' && reminder.recurringConfig) {
      return now.getDay() === reminder.recurringConfig.dayOfWeek;
    }
    
    if (reminder.recurring === 'monthly' && reminder.recurringConfig) {
      if (reminder.recurringConfig.subtype === 'dayOfMonth') {
        return now.getDate() === reminder.recurringConfig.dayOfMonth;
      } else if (reminder.recurringConfig.subtype === 'relativeDay') {
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
  });
  
  // Other active reminders (not today and not converted to tasks)
  const otherActiveReminders = reminders
    .filter(reminder => !reminder.completed && !reminder.convertedToTask && 
            !todayReminders.some(r => r.id === reminder.id))
    .slice(0, 5);
  
  // Identify overdue tasks
  const overdueTasks = tasks.filter(task => 
    !task.completed && 
    task.dueDate && 
    isPast(new Date(task.dueDate))
  ).slice(0, 5);
  
  // Format timer for display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle convert reminder to task
  const handleConvertToTask = (reminderId: string) => {
    convertReminderToTask(reminderId);
  };
  
  // Handle toggle task completion
  const handleToggleTaskCompletion = (taskId: string) => {
    toggleTaskCompletion(taskId);
  };
  
  // Get active task
  const activeTask = tasks.find(task => task.id === activeTaskId);
  
  return (
    <div>
      <PageTitle>Dashboard</PageTitle>
      
      <DashboardContainer>
        <DashboardCard>
          <DashboardTitle>
            Tasks To Do
            <ViewAllLink to="/tasks">View All</ViewAllLink>
          </DashboardTitle>
          <DashboardList>
            {incompleteTasks.length > 0 ? (
              incompleteTasks.map(task => (
                <ListItem key={task.id}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <CompletedCheckbox
                      checked={task.completed}
                      onChange={() => handleToggleTaskCompletion(task.id)}
                    />
                    <span>
                      {task.title}
                      {task.dueDate && isPast(new Date(task.dueDate)) && <OverdueTag>OVERDUE</OverdueTag>}
                      {task.convertedFromReminder && <span style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: '#805ad5', 
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        marginLeft: '8px'
                      }}>FROM REMINDER</span>}
                    </span>
                  </div>
                  <span>{task.priority}</span>
                </ListItem>
              ))
            ) : (
              <NoItems>No pending tasks</NoItems>
            )}
          </DashboardList>
        </DashboardCard>
        
        {todayReminders.length > 0 && (
          <DashboardCard>
            <DashboardTitle style={{ background: 'linear-gradient(90deg, #147a00, #2cb11b)' }}>
              Today's Reminders
              <ViewAllLink to="/reminders">View All</ViewAllLink>
            </DashboardTitle>
            <DashboardList>
              {todayReminders.map(reminder => {
                // Check if this reminder has been converted to a task
                const convertedToTask = reminder.convertedToTask;
                // Find the associated task if any
                const associatedTask = tasks.find(t => t.convertedFromReminder === reminder.id);
                
                return (
                  <ReminderItem key={reminder.id}>
                    <span>
                      {reminder.title}
                      <TodayTag>TODAY</TodayTag>
                      {associatedTask && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          backgroundColor: associatedTask.completed ? '#38a169' : '#805ad5', 
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          marginLeft: '8px'
                        }}>
                          {associatedTask.completed ? 'COMPLETED' : 'TASK CREATED'}
                        </span>
                      )}
                    </span>
                    {!convertedToTask ? (
                      <ConvertButton onClick={() => handleConvertToTask(reminder.id)}>
                        Add as Task
                      </ConvertButton>
                    ) : (
                      associatedTask && (
                        <ConvertButton 
                          onClick={() => handleToggleTaskCompletion(associatedTask.id)}
                          style={{ 
                            background: associatedTask.completed ? 
                              'linear-gradient(to bottom, #38a169, #2f855a)' : 
                              'linear-gradient(to bottom, #4f94ea, #3a7bd5)'
                          }}
                        >
                          {associatedTask.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </ConvertButton>
                      )
                    )}
                  </ReminderItem>
                );
              })}
            </DashboardList>
          </DashboardCard>
        )}
        
        {completedTasks.length > 0 && (
          <DashboardCard>
            <DashboardTitle style={{ background: 'linear-gradient(90deg, #38a169, #2f855a)' }}>
              Recently Completed
              <ViewAllLink to="/tasks">View All</ViewAllLink>
            </DashboardTitle>
            <DashboardList>
              {completedTasks.map(task => (
                <ListItem key={task.id}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <CompletedCheckbox
                      checked={task.completed}
                      onChange={() => handleToggleTaskCompletion(task.id)}
                    />
                    <span style={{ textDecoration: 'line-through', color: '#888' }}>
                      {task.title}
                      {task.convertedFromReminder && <span style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: '#805ad5', 
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        marginLeft: '8px'
                      }}>FROM REMINDER</span>}
                    </span>
                  </div>
                  <span>{format(new Date(task.createdAt), 'MMM d')}</span>
                </ListItem>
              ))}
            </DashboardList>
          </DashboardCard>
        )}
        
        {overdueTasks.length > 0 && (
          <DashboardCard>
            <DashboardTitle style={{ background: 'linear-gradient(90deg, #8B0000, #FF6347)' }}>
              Overdue Tasks
              <ViewAllLink to="/tasks">View All</ViewAllLink>
            </DashboardTitle>
            <DashboardList>
              {overdueTasks.map(task => (
                <ListItem key={task.id}>
                  <span>{task.title}</span>
                  <span>Due: {format(new Date(task.dueDate!), 'MMM d, h:mm a')}</span>
                </ListItem>
              ))}
            </DashboardList>
          </DashboardCard>
        )}
        
        <DashboardCard>
          <DashboardTitle>
            Upcoming Meetings
            <ViewAllLink to="/meetings">View All</ViewAllLink>
          </DashboardTitle>
          <DashboardList>
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map(meeting => (
                <ListItem key={meeting.id}>
                  <span>{meeting.title}</span>
                  <span>{format(new Date(meeting.date), 'MMM d, h:mm a')}</span>
                </ListItem>
              ))
            ) : (
              <NoItems>No upcoming meetings</NoItems>
            )}
          </DashboardList>
        </DashboardCard>
        
        <DashboardCard>
          <DashboardTitle>
            Active Reminders
            <ViewAllLink to="/reminders">View All</ViewAllLink>
          </DashboardTitle>
          <DashboardList>
            {otherActiveReminders.length > 0 ? (
              otherActiveReminders.map(reminder => (
                <ListItem key={reminder.id}>
                  <span>{reminder.title}</span>
                  <span>{reminder.recurring ? `${reminder.recurring}` : format(new Date(reminder.date), 'MMM d')}</span>
                </ListItem>
              ))
            ) : (
              <NoItems>No active reminders</NoItems>
            )}
          </DashboardList>
        </DashboardCard>
        
        <DashboardCard>
          <DashboardTitle>
            Current Activity
          </DashboardTitle>
          <CardContent>
            {activeTaskId ? (
              <div>
                <p><strong>Working on:</strong> {activeTask?.title}</p>
                <p><strong>Time elapsed:</strong> {formatTime(currentTimer)}</p>
              </div>
            ) : (
              <NoItems>No active timer</NoItems>
            )}
          </CardContent>
        </DashboardCard>
      </DashboardContainer>
    </div>
  );
};

export default Dashboard; 