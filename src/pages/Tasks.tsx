import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styled from 'styled-components';
import { format, isPast } from 'date-fns';
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
import TaskEditForm from '../components/TaskEditForm';
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
    content: '📋';
    font-size: 20px;
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  margin-bottom: 12px;
  border-radius: 4px;
  overflow: hidden;
`;

const CardHeader = styled.div<{ color?: string }>`
  background: ${props => props.color || '#0a246a'};
  color: white;
  padding: 10px 15px;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardBody = styled.div`
  padding: 0;
`;

const TaskItem = styled.div<{ completed?: boolean }>`
  padding: 12px 15px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  gap: 12px;
  background: ${props => props.completed ? '#fafafa' : '#fff'};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${props => props.completed ? '#f5f5f5' : '#f0f4ff'};
  }
`;

const Checkbox = styled.button<{ completed: boolean }>`
  width: 20px;
  height: 20px;
  min-width: 20px;
  border: 2px solid ${props => props.completed ? '#28a745' : '#aaa'};
  background: ${props => props.completed ? '#28a745' : '#fff'};
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  transition: all 0.15s;
  
  &:after {
    content: '${props => props.completed ? '✓' : ''}';
    color: white;
    font-size: 14px;
    font-weight: bold;
  }
  
  &:hover {
    border-color: ${props => props.completed ? '#1e7e34' : '#007bff'};
    background: ${props => props.completed ? '#1e7e34' : '#e8f4ff'};
  }
`;

const TaskContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const TaskTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
`;

const TaskTitle = styled.span<{ completed?: boolean }>`
  font-weight: 600;
  font-size: 14px;
  color: ${props => props.completed ? '#888' : '#1a1a1a'};
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
`;

const Badge = styled.span<{ variant?: 'high' | 'medium' | 'low' | 'danger' | 'purple' }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.variant) {
      case 'high': return '#dc3545';
      case 'medium': return '#fd7e14';
      case 'low': return '#28a745';
      case 'danger': return '#dc3545';
      case 'purple': return '#6f42c1';
      default: return '#6c757d';
    }
  }};
  color: white;
`;

const TaskDescription = styled.div`
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  margin: 8px 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const TaskMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
`;

const TaskActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: flex-start;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 6px 14px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
  
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

const ToggleButton = styled.button`
  padding: 4px 12px;
  background: rgba(255,255,255,0.9);
  color: #0a246a;
  border: none;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #fff;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 30px;
  margin-bottom: 12px;
  padding: 12px 15px;
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  border-radius: 4px;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
`;

const FilterSelect = styled.select`
  padding: 10px 15px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  min-width: 150px;
  height: 40px;
  cursor: pointer;
  
  &:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.15);
  }
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #888;
  font-size: 14px;
`;

const LoadMoreButton = styled(Button)`
  width: 100%;
  padding: 10px;
  margin: 15px;
  width: calc(100% - 30px);
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
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [completedTasksLimit, setCompletedTasksLimit] = useState(10);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
  };
  
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
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const isOverdue = (task: any): boolean => {
    return task.dueDate && !task.completed && isPast(new Date(task.dueDate));
  };
  
  const handleEditTask = (taskId: string, updates: any) => {
    updateTask(taskId, updates);
    setEditingTaskId(null);
  };
  
  const filterTasks = (taskList: any[]) => {
    return taskList.filter(task => {
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      
      if (timeFilter !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = task.dueDate ? new Date(task.dueDate) : null;

        switch (timeFilter) {
          case 'overdue': return isOverdue(task);
          case 'today':
            if (!taskDate) return false;
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return taskDate >= today && taskDate < tomorrow;
          case 'upcoming':
            if (!taskDate) return false;
            return taskDate > new Date();
        }
      }
      return true;
    });
  };

  const incompleteTasks = filterTasks(tasks.filter(task => !task.completed));
  const allCompletedTasks = tasks
    .filter(task => task.completed)
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());
  const completedTasks = allCompletedTasks.slice(0, completedTasksLimit);
  
  if (isLoading) return <LoadingState message="Loading tasks..." />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <PageContainer>
      <PageTitle>Tasks</PageTitle>
      
      <Card>
        <CardHeader color="linear-gradient(180deg, #495057, #343a40)">
          ➕ Add New Task
        </CardHeader>
        <div style={{ padding: 15 }}>
          <form onSubmit={handleSubmit}>
            <FormRow>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                required
              />
            </FormRow>
            
            <FormRow>
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details or notes..."
                rows={3}
              />
            </FormRow>
            
            <FormRowHorizontal>
              <FormRow>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟠 Medium</option>
                  <option value="high">🔴 High</option>
                </Select>
              </FormRow>
              
              <FormRow>
                <Label htmlFor="dueDate">Due Date</Label>
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
                {isAddingTask ? 'Adding...' : '+ Add Task'}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={resetForm} disabled={isAddingTask}>
                Clear
              </SecondaryButton>
            </ButtonRow>
          </form>
        </div>
      </Card>
      
      <FilterBar>
        <FilterGroup>
          <FilterLabel>Priority:</FilterLabel>
          <FilterSelect
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </FilterSelect>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Time:</FilterLabel>
          <FilterSelect
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="upcoming">Upcoming</option>
          </FilterSelect>
        </FilterGroup>
      </FilterBar>
      
      <Card>
        <CardHeader>
          📋 Active Tasks ({incompleteTasks.length})
        </CardHeader>
        <CardBody>
          {incompleteTasks.length === 0 ? (
            <EmptyState>
              {priorityFilter !== 'all' || timeFilter !== 'all' 
                ? '🔍 No tasks match your filters' 
                : '🎉 All tasks completed!'}
            </EmptyState>
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
                  <TaskItem>
                    <Checkbox
                      completed={false}
                      onClick={() => toggleTaskCompletion(task.id)}
                      disabled={isTogglingTask}
                    />
                    
                    <TaskContent>
                      <TaskTitleRow>
                        <TaskTitle>{task.title}</TaskTitle>
                        <Badge variant={task.priority}>{task.priority}</Badge>
                        {isOverdue(task) && <Badge variant="danger">OVERDUE</Badge>}
                        {task.convertedFromReminder && <Badge variant="purple">FROM REMINDER</Badge>}
                      </TaskTitleRow>
                      
                      {task.description && (
                        <TaskDescription>
                          <LinkifyText text={task.description} />
                        </TaskDescription>
                      )}
                      
                      <TaskMeta>
                        {task.dueDate && <span>📅 {format(new Date(task.dueDate), 'MMM d, h:mm a')}</span>}
                        {task.timeSpent > 0 && <span>⏱ {formatTime(task.timeSpent)}</span>}
                      </TaskMeta>
                    </TaskContent>
                    
                    <TaskActions>
                      {task.id === activeTaskId ? (
                        <Button variant="danger" onClick={() => stopTimer(task.id)} disabled={isUpdatingTask}>
                          ⏹ Stop
                        </Button>
                      ) : (
                        <Button onClick={() => startTimer(task.id)} disabled={!!activeTaskId || isUpdatingTask}>
                          ▶ Start
                        </Button>
                      )}
                      {!task.convertedFromReminder && (
                        <Button variant="secondary" onClick={() => setEditingTaskId(task.id)} disabled={isUpdatingTask}>
                          ✎ Edit
                        </Button>
                      )}
                      <Button variant="danger" onClick={() => deleteTask(task.id)} disabled={isDeletingTask}>
                        ✕
                      </Button>
                    </TaskActions>
                  </TaskItem>
                )}
              </React.Fragment>
            ))
          )}
        </CardBody>
      </Card>
      
      {allCompletedTasks.length > 0 && (
        <Card>
          <CardHeader color="linear-gradient(180deg, #6c757d, #545b62)">
            <span>✅ Completed Tasks ({allCompletedTasks.length})</span>
            <ToggleButton onClick={() => setShowCompletedTasks(!showCompletedTasks)}>
              {showCompletedTasks ? 'Hide' : 'Show'}
            </ToggleButton>
          </CardHeader>
          
          {showCompletedTasks && (
            <CardBody>
              {completedTasks.map(task => (
                <TaskItem key={task.id} completed>
                  <Checkbox
                    completed={true}
                    onClick={() => toggleTaskCompletion(task.id)}
                  />
                  
                  <TaskContent>
                    <TaskTitleRow>
                      <TaskTitle completed>{task.title}</TaskTitle>
                      <Badge variant={task.priority}>{task.priority}</Badge>
                    </TaskTitleRow>
                    
                    {task.description && (
                      <TaskDescription style={{ color: '#999' }}>
                        <LinkifyText text={task.description} />
                      </TaskDescription>
                    )}
                    
                    <TaskMeta>
                      {task.timeSpent > 0 && <span>⏱ {formatTime(task.timeSpent)}</span>}
                      <span>Completed {format(new Date(task.completedAt || task.createdAt), 'MMM d')}</span>
                    </TaskMeta>
                  </TaskContent>
                  
                  <TaskActions>
                    <Button variant="danger" onClick={() => deleteTask(task.id)}>
                      ✕
                    </Button>
                  </TaskActions>
                </TaskItem>
              ))}
              
              {completedTasksLimit < allCompletedTasks.length && (
                <LoadMoreButton onClick={() => setCompletedTasksLimit(prev => prev + 10)}>
                  Load More ({allCompletedTasks.length - completedTasksLimit} remaining)
                </LoadMoreButton>
              )}
            </CardBody>
          )}
        </Card>
      )}
    </PageContainer>
  );
};

export default Tasks;
