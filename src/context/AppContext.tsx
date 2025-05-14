import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Meeting, Reminder, TimerSession } from '../types';

interface AppContextType {
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'timeSpent' | 'timers'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  
  // Meetings
  meetings: Meeting[];
  addMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  updateMeeting: (meetingId: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (meetingId: string) => void;
  toggleMeetingCompletion: (meetingId: string) => void;
  
  // Reminders
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateReminder: (reminderId: string, updates: Partial<Reminder>) => void;
  deleteReminder: (reminderId: string) => void;
  toggleReminderCompletion: (reminderId: string) => void;
  
  // Timer
  startTimer: (taskId: string) => void;
  stopTimer: (taskId: string) => void;
  activeTaskId: string | null;
  currentTimer: number; // Current timer in seconds
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Get data from localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
    return defaultValue;
  }
};

// Save data to localStorage
const saveToLocalStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for tasks, meetings, reminders
  const [tasks, setTasks] = useState<Task[]>(() => 
    loadFromLocalStorage('tasks', [])
  );
  const [meetings, setMeetings] = useState<Meeting[]>(() => 
    loadFromLocalStorage('meetings', [])
  );
  const [reminders, setReminders] = useState<Reminder[]>(() => 
    loadFromLocalStorage('reminders', [])
  );
  
  // Timer state
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [currentTimer, setCurrentTimer] = useState<number>(0);
  const timerIntervalRef = useRef<number | null>(null);

  // Save to localStorage when state changes
  useEffect(() => {
    saveToLocalStorage('tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    saveToLocalStorage('meetings', meetings);
  }, [meetings]);

  useEffect(() => {
    saveToLocalStorage('reminders', reminders);
  }, [reminders]);
  
  // Clean up timer interval when component unmounts
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Task functions
  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'timeSpent' | 'timers'>) => {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date(),
      timeSpent: 0,
      timers: []
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, ...updates } : task));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Meeting functions
  const addMeeting = (meeting: Omit<Meeting, 'id'>) => {
    const newMeeting: Meeting = {
      ...meeting,
      id: uuidv4()
    };
    setMeetings([...meetings, newMeeting]);
  };

  const updateMeeting = (meetingId: string, updates: Partial<Meeting>) => {
    setMeetings(meetings.map(meeting => 
      meeting.id === meetingId ? { ...meeting, ...updates } : meeting
    ));
  };

  const deleteMeeting = (meetingId: string) => {
    setMeetings(meetings.filter(meeting => meeting.id !== meetingId));
  };

  const toggleMeetingCompletion = (meetingId: string) => {
    setMeetings(meetings.map(meeting => 
      meeting.id === meetingId ? { ...meeting, completed: !meeting.completed } : meeting
    ));
  };

  // Reminder functions
  const addReminder = (reminder: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: uuidv4()
    };
    setReminders([...reminders, newReminder]);
  };

  const updateReminder = (reminderId: string, updates: Partial<Reminder>) => {
    setReminders(reminders.map(reminder => 
      reminder.id === reminderId ? { ...reminder, ...updates } : reminder
    ));
  };

  const deleteReminder = (reminderId: string) => {
    setReminders(reminders.filter(reminder => reminder.id !== reminderId));
  };

  const toggleReminderCompletion = (reminderId: string) => {
    setReminders(reminders.map(reminder => 
      reminder.id === reminderId ? { ...reminder, completed: !reminder.completed } : reminder
    ));
  };

  // Timer functions
  const startTimer = (taskId: string) => {
    // Stop any existing timer
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Create new timer session
    const now = new Date();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      const newTimerSession: TimerSession = {
        id: uuidv4(),
        startTime: now,
        duration: 0
      };
      
      // Update task with new timer session
      const updatedTask = {
        ...task,
        timers: [...task.timers, newTimerSession]
      };
      
      updateTask(taskId, updatedTask);
      
      // Start timer interval
      const intervalId = window.setInterval(() => {
        setCurrentTimer(prev => prev + 1);
      }, 1000);
      
      timerIntervalRef.current = intervalId;
      setActiveTaskId(taskId);
      setCurrentTimer(0);
      
      console.log('Timer started for task: ' + task.title);
    }
  };

  const stopTimer = (taskId: string) => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.timers.length > 0) {
      const lastTimerIndex = task.timers.length - 1;
      const updatedTimers = [...task.timers];
      
      // Update the last timer session with end time
      updatedTimers[lastTimerIndex] = {
        ...updatedTimers[lastTimerIndex],
        endTime: new Date(),
        duration: currentTimer
      };
      
      // Update task with completed timer and increment total time spent
      const updatedTask = {
        ...task,
        timers: updatedTimers,
        timeSpent: task.timeSpent + currentTimer
      };
      
      updateTask(taskId, updatedTask);
      setActiveTaskId(null);
      setCurrentTimer(0);
      
      console.log('Timer stopped for task: ' + task.title);
    }
  };

  // Create context value object
  const contextValue: AppContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    
    meetings,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    toggleMeetingCompletion,
    
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderCompletion,
    
    startTimer,
    stopTimer,
    activeTaskId,
    currentTimer
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 