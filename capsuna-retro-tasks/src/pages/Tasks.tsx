import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styled from 'styled-components';
import { format } from 'date-fns';

const TasksContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const TaskForm = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
  padding: 16px;
  margin-bottom: 16px;
`;

const TaskList = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
`;

const TaskItem = styled.div<{ completed: boolean }>`
  padding: 8px 16px;
  border-bottom: 1px solid #dfdfdf;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 8px;
  align-items: center;
  ${({ completed }) => completed && 'text-decoration: line-through; color: #888;'}
  
  &:last-child {
    border-bottom: none;
  }
`;

const TaskActions = styled.div`
  display: flex;
  gap: 8px;
`;

const NoTasks = styled.div`
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

const TaskTitle = styled.div`
  font-weight: ${({ theme }) => theme.bold};
`;

const TaskInfo = styled.div`
  font-size: 0.8em;
  color: #888;
`;

const Tasks: React.FC = () => {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTaskCompletion, 
    startTimer, 
    stopTimer, 
    activeTaskId 
  } = useAppContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addTask({
      title,
      description,
      priority,
      completed: false,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    
    resetForm();
  };
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div>
      <h2>Tasks</h2>
      
      <TaskForm>
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
            <Label htmlFor="priority">Priority:</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </FormRow>
          
          <FormRow>
            <Label htmlFor="dueDate">Due Date (optional):</Label>
            <input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </FormRow>
          
          <div className="field-row">
            <button type="submit">Add Task</button>
            <button type="button" onClick={resetForm}>Reset</button>
          </div>
        </form>
      </TaskForm>
      
      <TaskList>
        {tasks.length === 0 ? (
          <NoTasks>No tasks yet. Add one above!</NoTasks>
        ) : (
          tasks.map(task => (
            <TaskItem key={task.id} completed={task.completed}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTaskCompletion(task.id)}
              />
              
              <div>
                <TaskTitle>{task.title}</TaskTitle>
                {task.description && <div>{task.description}</div>}
                <TaskInfo>
                  Priority: {task.priority}
                  {task.dueDate && ` • Due: ${format(new Date(task.dueDate), 'MMM d, h:mm a')}`}
                  {task.timeSpent > 0 && ` • Time spent: ${formatTime(task.timeSpent)}`}
                </TaskInfo>
              </div>
              
              <div>
                {task.id === activeTaskId ? (
                  <button onClick={() => stopTimer(task.id)}>Stop Timer</button>
                ) : (
                  !task.completed && (
                    <button 
                      onClick={() => startTimer(task.id)}
                      disabled={!!activeTaskId}
                    >
                      Start Timer
                    </button>
                  )
                )}
              </div>
              
              <TaskActions>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="error"
                >
                  Delete
                </button>
              </TaskActions>
            </TaskItem>
          ))
        )}
      </TaskList>
    </div>
  );
};

export default Tasks; 