import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { format, isPast } from 'date-fns';
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

const Dashboard: React.FC = () => {
  const { 
    tasks, 
    meetings, 
    reminders, 
    currentTimer, 
    activeTaskId,
    isLoading,
    error
  } = useAppContext();
  
  if (isLoading) {
    return <LoadingState message="Loading your dashboard..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  // Get incomplete tasks, upcoming meetings, and active reminders
  const incompleteTasks = tasks.filter(task => !task.completed).slice(0, 5);
  const upcomingMeetings = meetings
    .filter(meeting => new Date(meeting.date) > new Date() && !meeting.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  const activeReminders = reminders.filter(reminder => !reminder.completed).slice(0, 5);
  
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
                  <span>
                    {task.title}
                    {task.dueDate && isPast(new Date(task.dueDate)) && <OverdueTag>OVERDUE</OverdueTag>}
                  </span>
                  <span>{task.priority}</span>
                </ListItem>
              ))
            ) : (
              <NoItems>No pending tasks</NoItems>
            )}
          </DashboardList>
        </DashboardCard>
        
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
            {activeReminders.length > 0 ? (
              activeReminders.map(reminder => (
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