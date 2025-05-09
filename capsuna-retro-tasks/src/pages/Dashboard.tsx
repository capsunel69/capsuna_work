import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const DashboardCard = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
  padding: 16px;
  margin-bottom: 16px;
`;

const DashboardTitle = styled.div`
  background: linear-gradient(90deg, #000080, #1084d0);
  color: white;
  padding: 4px 8px;
  margin-bottom: 16px;
  font-weight: bold;
`;

const DashboardList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
`;

const ListItem = styled.li`
  padding: 4px 0;
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
  padding: 16px;
`;

const Dashboard: React.FC = () => {
  const { tasks, meetings, reminders, currentTimer, activeTaskId } = useAppContext();
  
  // Get incomplete tasks, upcoming meetings, and active reminders
  const incompleteTasks = tasks.filter(task => !task.completed).slice(0, 5);
  const upcomingMeetings = meetings
    .filter(meeting => new Date(meeting.date) > new Date() && !meeting.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  const activeReminders = reminders.filter(reminder => !reminder.completed).slice(0, 5);
  
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
      <h2>Dashboard</h2>
      
      {activeTaskId && activeTask && (
        <DashboardCard>
          <DashboardTitle>Active Timer</DashboardTitle>
          <div>
            <div><strong>Task:</strong> {activeTask.title}</div>
            <div><strong>Time:</strong> {formatTime(currentTimer)}</div>
          </div>
        </DashboardCard>
      )}
      
      <DashboardContainer>
        <DashboardCard>
          <DashboardTitle>
            Incomplete Tasks
            <Link to="/tasks" style={{ float: 'right', color: 'white', fontSize: '0.8em' }}>View All</Link>
          </DashboardTitle>
          {incompleteTasks.length > 0 ? (
            <DashboardList>
              {incompleteTasks.map(task => (
                <ListItem key={task.id}>
                  <span>{task.title}</span>
                  <span>{task.priority}</span>
                </ListItem>
              ))}
            </DashboardList>
          ) : (
            <NoItems>No incomplete tasks</NoItems>
          )}
        </DashboardCard>
        
        <DashboardCard>
          <DashboardTitle>
            Upcoming Meetings
            <Link to="/meetings" style={{ float: 'right', color: 'white', fontSize: '0.8em' }}>View All</Link>
          </DashboardTitle>
          {upcomingMeetings.length > 0 ? (
            <DashboardList>
              {upcomingMeetings.map(meeting => (
                <ListItem key={meeting.id}>
                  <span>{meeting.title}</span>
                  <span>{format(new Date(meeting.date), 'MMM d, h:mm a')}</span>
                </ListItem>
              ))}
            </DashboardList>
          ) : (
            <NoItems>No upcoming meetings</NoItems>
          )}
        </DashboardCard>
        
        <DashboardCard>
          <DashboardTitle>
            Active Reminders
            <Link to="/reminders" style={{ float: 'right', color: 'white', fontSize: '0.8em' }}>View All</Link>
          </DashboardTitle>
          {activeReminders.length > 0 ? (
            <DashboardList>
              {activeReminders.map(reminder => (
                <ListItem key={reminder.id}>
                  <span>{reminder.title}</span>
                  <span>{format(new Date(reminder.date), 'MMM d, h:mm a')}</span>
                </ListItem>
              ))}
            </DashboardList>
          ) : (
            <NoItems>No active reminders</NoItems>
          )}
        </DashboardCard>
        
        <DashboardCard>
          <DashboardTitle>Statistics</DashboardTitle>
          <div>
            <div>Total Tasks: {tasks.length}</div>
            <div>Completed Tasks: {tasks.filter(task => task.completed).length}</div>
            <div>Upcoming Meetings: {upcomingMeetings.length}</div>
            <div>Active Reminders: {activeReminders.length}</div>
          </div>
        </DashboardCard>
      </DashboardContainer>
    </div>
  );
};

export default Dashboard; 