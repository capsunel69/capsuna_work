export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  timeSpent: number; // in seconds
  timers: TimerSession[];
  convertedFromReminder?: string; // ID of the reminder this task was converted from
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: Date;
  duration: number; // in minutes
  participants: string[];
  notes: string;
  completed: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: Date;
  completed: boolean;
  recurring?: 'daily' | 'weekly' | 'monthly';
  recurringConfig?: {
    type: string;
    subtype?: 'dayOfMonth' | 'relativeDay';
    dayOfWeek?: number;
    dayOfMonth?: number;
    weekNum?: number;
  };
  convertedToTask?: boolean; // Whether this reminder has been converted to a task
  completedInstances?: Date[]; // Dates when recurring reminder was completed
}

export interface TimerSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
} 