import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { format, isPast, isSameDay } from 'date-fns';
import styled from 'styled-components';
import LoadingState from '../components/shared/LoadingState';
import ErrorMessage from '../components/shared/ErrorMessage';

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
    content: '📊';
    font-size: 20px;
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const CardHeader = styled.div<{ color?: string }>`
  background: ${props => props.color || '#0a246a'};
  color: white;
  padding: 10px 12px;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardBody = styled.div`
  padding: 0;
  max-height: 280px;
  overflow-y: auto;
`;

const ViewAllLink = styled(Link)`
  color: rgba(255,255,255,0.9);
  font-size: 12px;
  font-weight: normal;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
    color: #fff;
  }
`;

const ListItem = styled.div`
  padding: 10px 12px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f0f4ff;
  }
`;

const Checkbox = styled.button<{ checked: boolean }>`
  width: 16px;
  height: 16px;
  min-width: 16px;
  border: 1px solid ${props => props.checked ? '#28a745' : '#888'};
  background: ${props => props.checked ? '#28a745' : '#fff'};
  border-radius: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:after {
    content: '${props => props.checked ? '✓' : ''}';
    color: white;
    font-size: 12px;
    font-weight: bold;
  }
`;

const TaskInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const TaskName = styled.span<{ completed?: boolean }>`
  font-weight: 500;
  color: ${props => props.completed ? '#888' : '#222'};
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
`;

const Badge = styled.span<{ variant?: 'danger' | 'warning' | 'success' | 'info' | 'purple' }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  margin-left: 8px;
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#dc3545';
      case 'warning': return '#fd7e14';
      case 'success': return '#28a745';
      case 'info': return '#17a2b8';
      case 'purple': return '#6f42c1';
      default: return '#6c757d';
    }
  }};
  color: white;
`;

const PriorityText = styled.span<{ priority: string }>`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${props => {
    switch (props.priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#fd7e14';
      case 'low': return '#28a745';
      default: return '#666';
    }
  }};
`;

const MetaText = styled.span`
  font-size: 12px;
  color: #666;
  white-space: nowrap;
`;

const EmptyState = styled.div`
  padding: 30px 20px;
  text-align: center;
  color: #888;
  font-size: 13px;
`;

const ActionButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #0056b3;
  }
`;

const ActivityCard = styled(Card)`
  grid-column: span 2;
  
  @media (max-width: 900px) {
    grid-column: span 1;
  }
`;

const ActivityContent = styled.div`
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 20px;
`;

const TimerDisplay = styled.div`
  font-size: 28px;
  font-weight: bold;
  color: #28a745;
  font-variant-numeric: tabular-nums;
`;

const Dashboard: React.FC = () => {
  const { 
    tasks, 
    meetings, 
    reminders, 
    currentTimer,
    currentDate,
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
  
  const incompleteTasks = tasks.filter(task => !task.completed).slice(0, 6);
  const completedTasks = tasks
    .filter(task => task.completed)
    .sort((a, b) => {
      const dateA = a.completedAt || a.createdAt;
      const dateB = b.completedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 5);
    
  const upcomingMeetings = meetings
    .filter(meeting => !meeting.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  
  const todayReminders = reminders.filter(reminder => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    if (!reminder.recurring) {
      if (reminder.completed || reminder.convertedToTask) return false;
      const reminderDate = new Date(reminder.date);
      reminderDate.setHours(0, 0, 0, 0);
      return reminderDate.getTime() === today.getTime();
    }
    
    let shouldShowToday = false;
    
    if (reminder.recurring === 'daily') {
      shouldShowToday = true;
    } else if (reminder.recurring === 'weekly' && reminder.recurringConfig) {
      shouldShowToday = today.getDay() === reminder.recurringConfig.dayOfWeek;
    } else if (reminder.recurring === 'monthly' && reminder.recurringConfig) {
      if (reminder.recurringConfig.subtype === 'dayOfMonth') {
        shouldShowToday = today.getDate() === reminder.recurringConfig.dayOfMonth;
      } else {
        const weekNum = reminder.recurringConfig.weekNum!;
        const dayOfWeek = reminder.recurringConfig.dayOfWeek!;
        let targetDate;
        
        if (weekNum === -1) {
          const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          let day = lastDayOfMonth.getDate();
          while (new Date(today.getFullYear(), today.getMonth(), day).getDay() !== dayOfWeek) {
            day--;
          }
          targetDate = new Date(today.getFullYear(), today.getMonth(), day);
        } else {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const firstDayOfWeek = firstDay.getDay();
          let dayOffset = dayOfWeek - firstDayOfWeek;
          if (dayOffset < 0) dayOffset += 7;
          const day = 1 + dayOffset + (weekNum - 1) * 7;
          targetDate = new Date(today.getFullYear(), today.getMonth(), day);
        }
        
        shouldShowToday = isSameDay(today, targetDate);
      }
    }
    
    if (!shouldShowToday) return false;
    
    const isCompletedToday = (reminder.completedInstances || []).some(date => {
      const completedDate = new Date(date);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
    
    return !isCompletedToday;
  });

  const overdueTasks = tasks.filter(task => 
    !task.completed && 
    task.dueDate && 
    isPast(new Date(task.dueDate)) &&
    new Date(task.dueDate) < new Date(currentDate)
  ).slice(0, 5);
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const activeTask = tasks.find(task => task.id === activeTaskId);
  
  return (
    <PageContainer>
      <PageTitle>Dashboard</PageTitle>
      
      {activeTaskId && activeTask && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader color="linear-gradient(180deg, #28a745, #1e7e34)">
            ⏱️ Active Timer
          </CardHeader>
          <ActivityContent>
            <TimerDisplay>{formatTime(currentTimer)}</TimerDisplay>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{activeTask.title}</div>
              <MetaText>Total time spent: {formatTime(activeTask.timeSpent + currentTimer)}</MetaText>
            </div>
          </ActivityContent>
        </Card>
      )}
      
      <DashboardGrid>
        <Card>
          <CardHeader>
            📋 Tasks To Do ({incompleteTasks.length})
            <ViewAllLink to="/tasks">View All →</ViewAllLink>
          </CardHeader>
          <CardBody>
            {incompleteTasks.length > 0 ? (
              incompleteTasks.map(task => (
                <ListItem key={task.id}>
                  <Checkbox
                    checked={false}
                    onClick={() => toggleTaskCompletion(task.id)}
                  />
                  <TaskInfo>
                    <TaskName>
                      {task.title}
                      {task.dueDate && isPast(new Date(task.dueDate)) && (
                        <Badge variant="danger">OVERDUE</Badge>
                      )}
                    </TaskName>
                  </TaskInfo>
                  <PriorityText priority={task.priority}>{task.priority}</PriorityText>
                </ListItem>
              ))
            ) : (
              <EmptyState>🎉 All tasks completed!</EmptyState>
            )}
          </CardBody>
        </Card>
        
        {overdueTasks.length > 0 && (
          <Card>
            <CardHeader color="linear-gradient(180deg, #dc3545, #c82333)">
              ⚠️ Overdue Tasks ({overdueTasks.length})
              <ViewAllLink to="/tasks">View All →</ViewAllLink>
            </CardHeader>
            <CardBody>
              {overdueTasks.map(task => (
                <ListItem key={task.id}>
                  <TaskInfo>
                    <TaskName>{task.title}</TaskName>
                  </TaskInfo>
                  <MetaText>Due: {format(new Date(task.dueDate!), 'MMM d')}</MetaText>
                </ListItem>
              ))}
            </CardBody>
          </Card>
        )}
        
        {todayReminders.length > 0 && (
          <Card>
            <CardHeader color="linear-gradient(180deg, #28a745, #1e7e34)">
              🔔 Today's Reminders ({todayReminders.length})
              <ViewAllLink to="/reminders">View All →</ViewAllLink>
            </CardHeader>
            <CardBody>
              {todayReminders.map(reminder => {
                const isTaskCreated = reminder.recurring
                  ? (reminder.convertedToTaskDates || []).some(date => {
                      const convertedDate = new Date(date);
                      const today = new Date(currentDate);
                      today.setHours(0, 0, 0, 0);
                      convertedDate.setHours(0, 0, 0, 0);
                      return convertedDate.getTime() === today.getTime();
                    })
                  : reminder.convertedToTask;
                
                return (
                  <ListItem key={reminder.id}>
                    <TaskInfo>
                      <TaskName>{reminder.title}</TaskName>
                      {isTaskCreated && <Badge variant="purple">Task Created</Badge>}
                    </TaskInfo>
                    {!isTaskCreated && (
                      <ActionButton onClick={() => convertReminderToTask(reminder.id)}>
                        + Add Task
                      </ActionButton>
                    )}
                  </ListItem>
                );
              })}
            </CardBody>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            📅 Upcoming Meetings
            <ViewAllLink to="/meetings">View All →</ViewAllLink>
          </CardHeader>
          <CardBody>
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map(meeting => (
                <ListItem key={meeting.id}>
                  <TaskInfo>
                    <TaskName>
                      {meeting.title}
                      {new Date(meeting.date) < new Date(currentDate) && (
                        <Badge variant="danger">OVERDUE</Badge>
                      )}
                    </TaskName>
                  </TaskInfo>
                  <MetaText>{format(new Date(meeting.date), 'MMM d, h:mm a')}</MetaText>
                </ListItem>
              ))
            ) : (
              <EmptyState>No upcoming meetings</EmptyState>
            )}
          </CardBody>
        </Card>
        
        {completedTasks.length > 0 && (
          <Card>
            <CardHeader color="linear-gradient(180deg, #6c757d, #545b62)">
              ✅ Recently Completed
              <ViewAllLink to="/tasks">View All →</ViewAllLink>
            </CardHeader>
            <CardBody>
              {completedTasks.map(task => (
                <ListItem key={task.id}>
                  <Checkbox
                    checked={true}
                    onClick={() => toggleTaskCompletion(task.id)}
                  />
                  <TaskInfo>
                    <TaskName completed>{task.title}</TaskName>
                  </TaskInfo>
                  <MetaText>{format(new Date(task.completedAt || task.createdAt), 'MMM d')}</MetaText>
                </ListItem>
              ))}
            </CardBody>
          </Card>
        )}
      </DashboardGrid>
    </PageContainer>
  );
};

export default Dashboard;
