import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styled from 'styled-components';
import { format, isPast } from 'date-fns';
import {
  FormContainer,
  FormRow,
  FormRowHorizontal,
  Label,
  Input,
  Select,
  TextArea,
  ButtonRow,
  PrimaryButton,
  SecondaryButton
} from '../components/shared/FormStyles';
import { OverdueTag } from '../components/shared/TagStyles';
import TaskEditForm from '../components/TaskEditForm';
import LoadingState from '../components/shared/LoadingState';
import ErrorMessage from '../components/shared/ErrorMessage';

const TasksContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const TaskList = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888, 0 3px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background-color: #fff;
`;

const TaskItem = styled.div<{ completed: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid #dfdfdf;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 12px;
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
  font-size: 1.1rem;
`;

const TaskTitle = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
`;

const TaskInfo = styled.div`
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

const ActionButton = styled.button`
  font-size: 0.9rem;
  padding: 6px 12px;
  background: linear-gradient(to bottom, #4f94ea, #3a7bd5);
  color: white;
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

const Tasks: React.FC = () => {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTaskCompletion, 
    startTimer, 
    stopTimer, 
    activeTaskId,
    isLoading,
    error
  } = useAppContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
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
  
  // Check if task is overdue
  const isOverdue = (task: any): boolean => {
    return task.dueDate && !task.completed && isPast(new Date(task.dueDate));
  };
  
  // Handle task edit
  const handleEditTask = (taskId: string, updates: any) => {
    updateTask(taskId, updates);
    setEditingTaskId(null);
  };
  
  if (isLoading) {
    return <LoadingState message="Loading tasks..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  return (
    <div>
      <PageTitle>Tasks</PageTitle>
      
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
              <Label htmlFor="priority">Priority:</Label>
              <Select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </FormRow>
            
            <FormRow>
              <Label htmlFor="dueDate">Due Date (optional):</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </FormRow>
          </FormRowHorizontal>
          
          <ButtonRow>
            <PrimaryButton type="submit">Add Task</PrimaryButton>
            <SecondaryButton type="button" onClick={resetForm}>Reset</SecondaryButton>
          </ButtonRow>
        </form>
      </FormContainer>
      
      <TaskList>
        {tasks.length === 0 ? (
          <NoTasks>No tasks yet. Add one above!</NoTasks>
        ) : (
          tasks.map(task => (
            <React.Fragment key={task.id}>
              {editingTaskId === task.id ? (
                <TaskEditForm 
                  task={task} 
                  onSave={handleEditTask} 
                  onCancel={() => setEditingTaskId(null)} 
                />
              ) : (
                <TaskItem completed={task.completed}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(task.id)}
                  />
                  
                  <div>
                    <TaskTitle>
                      {task.title}
                      {isOverdue(task) && <OverdueTag>OVERDUE</OverdueTag>}
                    </TaskTitle>
                    {task.description && <div>{task.description}</div>}
                    <TaskInfo>
                      Priority: {task.priority}
                      {task.dueDate && ` • Due: ${format(new Date(task.dueDate), 'MMM d, h:mm a')}`}
                      {task.timeSpent > 0 && ` • Time spent: ${formatTime(task.timeSpent)}`}
                    </TaskInfo>
                  </div>
                  
                  <div>
                    {task.id === activeTaskId ? (
                      <ActionButton onClick={() => stopTimer(task.id)}>Stop Timer</ActionButton>
                    ) : (
                      !task.completed && (
                        <ActionButton 
                          onClick={() => startTimer(task.id)}
                          disabled={!!activeTaskId}
                        >
                          Start Timer
                        </ActionButton>
                      )
                    )}
                  </div>
                  
                  <TaskActions>
                    <ActionButton 
                      onClick={() => setEditingTaskId(task.id)}
                    >
                      Edit
                    </ActionButton>
                    <DeleteButton 
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </DeleteButton>
                  </TaskActions>
                </TaskItem>
              )}
            </React.Fragment>
          ))
        )}
      </TaskList>
    </div>
  );
};

export default Tasks; 