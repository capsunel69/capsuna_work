import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
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
} from './shared/FormStyles';

interface TaskEditFormProps {
  task: Task;
  onSave: (taskId: string, updatedTask: Partial<Task>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TaskEditForm: React.FC<TaskEditFormProps> = ({ task, onSave, onCancel, isLoading = false }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
  );

  // Reset form when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setDueDate(
      task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
    );
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave(task.id, {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormRow>
          <Label htmlFor="edit-title">Title:</Label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isLoading}
          />
        </FormRow>
        
        <FormRow>
          <Label htmlFor="edit-description">Description:</Label>
          <TextArea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
        </FormRow>
        
        <FormRowHorizontal>
          <FormRow>
            <Label htmlFor="edit-priority">Priority:</Label>
            <Select
              id="edit-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              disabled={isLoading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </FormRow>
          
          <FormRow>
            <Label htmlFor="edit-dueDate">Due Date (optional):</Label>
            <DateInput
              id="edit-dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isLoading}
            />
          </FormRow>
        </FormRowHorizontal>
        
        <ButtonRow>
          <PrimaryButton type="submit" disabled={isLoading}>
            {isLoading ? 'Saving Changes...' : 'Save Changes'}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onCancel} disabled={isLoading}>
            Cancel
          </SecondaryButton>
        </ButtonRow>
      </form>
    </FormContainer>
  );
};

export default TaskEditForm; 