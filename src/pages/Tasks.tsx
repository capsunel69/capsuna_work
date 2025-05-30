import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styled from 'styled-components';
import { format, isPast } from 'date-fns';
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
import { OverdueTag } from '../components/shared/TagStyles';
import TaskEditForm from '../components/TaskEditForm';
import LoadingState from '../components/shared/LoadingState';
import ErrorMessage from '../components/shared/ErrorMessage';

const TaskList = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888, 0 3px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background-color: #fff;
  margin-bottom: 24px;
`;

const TaskListHeader = styled.div`
  padding: 12px 16px;
  background: linear-gradient(to bottom, #f0f0f0, #e1e1e1);
  border-bottom: 1px solid #dfdfdf;
  font-weight: bold;
  font-size: 1.1rem;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RetroCheckbox = styled.button<{ completed: boolean }>`
  width: 24px;
  height: 24px;
  border: 2px solid #888;
  background: linear-gradient(to bottom, #f0f0f0, #e1e1e1);
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
  border-radius: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-right: 8px;
  
  &:before {
    content: '${props => props.completed ? '✗' : '✓'}';
    color: ${props => props.completed ? '#e53e3e' : '#2f855a'};
    font-size: 18px;
    font-weight: bold;
  }
  
  &:hover {
    background: linear-gradient(to bottom, #ffffff, #f0f0f0);
  }
  
  &:active {
    background: #e1e1e1;
    box-shadow: inset -1px -1px 0px 1px #ffffff, inset 1px 1px 0px 1px #888888;
  }
`;

const TaskItem = styled.div<{ completed: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid #dfdfdf;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 12px;
  align-items: center;
  ${({ completed }) => completed && 'color: #888;'}
  
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

const ToggleButton = styled.button`
  font-size: 0.9rem;
  padding: 6px 12px;
  background: linear-gradient(to bottom, #e6e6e6, #d5d5d5);
  color: #333;
  border-radius: 4px;
  border: 1px solid #b9b9b9;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
  }
  
  &:active {
    background: #d5d5d5;
  }
`;

const ConvertedTag = styled.span`
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background-color: #805ad5;
  color: white;
  border-radius: 3px;
  font-size: 0.75rem;
`;

const FilterContainer = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f8f8;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const FilterSelect = styled(Select)`
  width: 100%;
`;

const LoadMoreButton = styled(ActionButton)`
  width: 100%;
  margin: 16px 0;
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
    isAddingTask,
    isDeletingTask,
    isUpdatingTask,
    isTogglingTask,
    error
  } = useAppContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Filter state
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  
  // Completed tasks pagination
  const [completedTasksLimit, setCompletedTasksLimit] = useState(10);
  
  // Edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // Toggle state for completed tasks visibility
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  
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
  
  // Filter tasks
  const filterTasks = (tasks: any[]) => {
    return tasks.filter(task => {
      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Time filter
      if (timeFilter !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = task.dueDate ? new Date(task.dueDate) : null;

        switch (timeFilter) {
          case 'overdue':
            return isOverdue(task);
          case 'today':
            if (!taskDate) return false;
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return taskDate >= today && taskDate < tomorrow;
          case 'upcoming':
            if (!taskDate) return false;
            return taskDate > new Date();
          default:
            return true;
        }
      }

      return true;
    });
  };

  // Filter and sort tasks
  const incompleteTasks = filterTasks(tasks.filter(task => !task.completed));
  const allCompletedTasks = tasks
    .filter(task => task.completed)
    .sort((a, b) => {
      const dateA = a.completedAt || a.createdAt;
      const dateB = b.completedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  const completedTasks = allCompletedTasks.slice(0, completedTasksLimit);
  
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
              <DateInput
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </FormRow>
          </FormRowHorizontal>
          
          <ButtonRow>
            <PrimaryButton type="submit" disabled={isAddingTask}>
              {isAddingTask ? 'Adding Task...' : 'Add Task'}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={resetForm} disabled={isAddingTask}>
              Reset
            </SecondaryButton>
          </ButtonRow>
        </form>
      </FormContainer>
      
      <FilterContainer>
        <div>
          <Label htmlFor="priorityFilter">Filter by Priority:</Label>
          <FilterSelect
            id="priorityFilter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'low' | 'medium' | 'high')}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </FilterSelect>
        </div>
        
        <div>
          <Label htmlFor="timeFilter">Filter by Time:</Label>
          <FilterSelect
            id="timeFilter"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as 'all' | 'overdue' | 'today' | 'upcoming')}
          >
            <option value="all">All Time</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="upcoming">Upcoming</option>
          </FilterSelect>
        </div>
      </FilterContainer>
      
      {/* Active tasks */}
      <TaskList>
        <TaskListHeader>
          <span>Active Tasks ({incompleteTasks.length})</span>
        </TaskListHeader>
        
        {incompleteTasks.length === 0 ? (
          <NoTasks>No active tasks matching the current filters.</NoTasks>
        ) : (
          incompleteTasks.map(task => (
            <React.Fragment key={task.id}>
              {editingTaskId === task.id ? (
                <TaskEditForm 
                  task={task} 
                  onSave={handleEditTask}
                  onCancel={() => setEditingTaskId(null)}
                  isLoading={isUpdatingTask}
                />
              ) : (
                <TaskItem completed={task.completed}>
                  <RetroCheckbox
                    completed={task.completed}
                    onClick={() => toggleTaskCompletion(task.id)}
                    disabled={isTogglingTask}
                    aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                  />
                  
                  <div>
                    <TaskTitle>
                      {task.title}
                      {isOverdue(task) && <OverdueTag>OVERDUE</OverdueTag>}
                      {task.convertedFromReminder && <ConvertedTag>FROM REMINDER</ConvertedTag>}
                    </TaskTitle>
                    {task.description && (
                      <div>
                        <LinkifyText text={task.description} />
                      </div>
                    )}
                    <TaskInfo>
                      Priority: {task.priority}
                      {task.dueDate && ` • Due: ${format(new Date(task.dueDate), 'MMM d, h:mm a')}`}
                      {task.timeSpent > 0 && ` • Time spent: ${formatTime(task.timeSpent)}`}
                    </TaskInfo>
                  </div>
                  
                  <div>
                    {task.id === activeTaskId ? (
                      <ActionButton 
                        onClick={() => stopTimer(task.id)}
                        disabled={isUpdatingTask || isTogglingTask}
                      >
                        Stop Timer
                      </ActionButton>
                    ) : (
                      !task.completed && (
                        <ActionButton 
                          onClick={() => startTimer(task.id)}
                          disabled={!!activeTaskId || isUpdatingTask || isTogglingTask}
                        >
                          Start Timer
                        </ActionButton>
                      )
                    )}
                  </div>
                  
                  <TaskActions>
                    {!task.convertedFromReminder && (
                      <ActionButton 
                        onClick={() => setEditingTaskId(task.id)}
                        disabled={isUpdatingTask || isDeletingTask || isTogglingTask}
                      >
                        Edit
                      </ActionButton>
                    )}
                    <DeleteButton 
                      onClick={() => deleteTask(task.id)}
                      disabled={isDeletingTask || isUpdatingTask || isTogglingTask}
                    >
                      {isDeletingTask && task.id === editingTaskId ? 'Deleting...' : 'Delete'}
                    </DeleteButton>
                  </TaskActions>
                </TaskItem>
              )}
            </React.Fragment>
          ))
        )}
      </TaskList>
      
      {/* Completed tasks */}
      {allCompletedTasks.length > 0 && (
        <TaskList>
          <TaskListHeader>
            <span>Completed Tasks ({allCompletedTasks.length})</span>
            <ToggleButton 
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            >
              {showCompletedTasks ? 'Hide' : 'Show'}
            </ToggleButton>
          </TaskListHeader>
          
          {showCompletedTasks && (
            <>
              {completedTasks.map(task => (
                <TaskItem key={task.id} completed={task.completed}>
                  <RetroCheckbox
                    completed={task.completed}
                    onClick={() => toggleTaskCompletion(task.id)}
                    aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                  />
                  
                  <div>
                    <TaskTitle>
                      {task.title}
                      {task.convertedFromReminder && <ConvertedTag>FROM REMINDER</ConvertedTag>}
                    </TaskTitle>
                    {task.description && (
                      <div>
                        <LinkifyText text={task.description} />
                      </div>
                    )}
                    <TaskInfo>
                      Priority: {task.priority}
                      {task.dueDate && ` • Due: ${format(new Date(task.dueDate), 'MMM d, h:mm a')}`}
                      {task.timeSpent > 0 && ` • Time spent: ${formatTime(task.timeSpent)}`}
                    </TaskInfo>
                  </div>
                  
                  <TaskActions>
                    {/* Do not show Edit button for tasks linked to reminders */}
                    {!task.convertedFromReminder && !task.completed && (
                      <ActionButton 
                        onClick={() => setEditingTaskId(task.id)}
                      >
                        Edit
                      </ActionButton>
                    )}
                    <DeleteButton 
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </DeleteButton>
                  </TaskActions>
                </TaskItem>
              ))}
              
              {completedTasksLimit < allCompletedTasks.length && (
                <div style={{ padding: '16px' }}>
                  <LoadMoreButton
                    onClick={() => setCompletedTasksLimit(prev => prev + 10)}
                  >
                    Load More Completed Tasks
                  </LoadMoreButton>
                </div>
              )}
            </>
          )}
        </TaskList>
      )}
    </div>
  );
};

export default Tasks; 