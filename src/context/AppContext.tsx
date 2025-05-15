import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isSameDay } from 'date-fns';
import type { Task, Meeting, Reminder, TimerSession, Journal } from '../types';
import { TasksAPI, MeetingsAPI, RemindersAPI, JournalsAPI } from '../services/api';

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
  convertReminderToTask: (reminderId: string) => void;
  
  // Journals
  journals: Journal[];
  addJournal: (journal: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateJournal: (journalId: string, updates: Partial<Journal>) => void;
  deleteJournal: (journalId: string) => void;
  searchJournals: (query: string) => Promise<Journal[]>;
  
  // Timer
  startTimer: (taskId: string) => void;
  stopTimer: (taskId: string) => void;
  activeTaskId: string | null;
  currentTimer: number; // Current timer in seconds

  // Current Date
  currentDate: Date;
  setCurrentDate: (date: Date) => void;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // New properties
  canConvertReminderToTask: (reminder: Reminder) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Get data from localStorage (fallback if API fails)
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]); 
  const [journals, setJournals] = useState<Journal[]>([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [currentTimer, setCurrentTimer] = useState<number>(0);
  const timerIntervalRef = useRef<number | null>(null);

  // Current date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Load data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch tasks, meetings, and reminders in parallel
        const [tasksData, meetingsData, remindersData, journalsData] = await Promise.all([
          TasksAPI.getAll(),
          MeetingsAPI.getAll(),
          RemindersAPI.getAll(),
          JournalsAPI.getAll()
        ]);
        
        // Clean up any stale reminder conversion states by checking against actual tasks
        const cleanedReminders = remindersData.map(reminder => {
          if (reminder.recurring) {
            // For recurring reminders, only keep convertedToTaskDates that have corresponding tasks
            const validDates = (reminder.convertedToTaskDates || []).filter(date => {
              const convertedDate = new Date(date);
              convertedDate.setHours(0, 0, 0, 0);
              // Check if there's a task for this reminder on this date
              return tasksData.some(task => 
                task.convertedFromReminder === reminder.id && 
                isSameDay(new Date(task.createdAt), convertedDate)
              );
            });
            
            return {
              ...reminder,
              convertedToTaskDates: validDates
            };
          } else {
            // For non-recurring reminders, check if the task still exists
            const hasAssociatedTask = tasksData.some(task => 
              task.convertedFromReminder === reminder.id
            );
            
            return {
              ...reminder,
              convertedToTask: hasAssociatedTask
            };
          }
        });

        // Update the cleaned reminders in the database
        await Promise.all(cleanedReminders.map(reminder => 
          RemindersAPI.update(reminder.id, 
            reminder.recurring 
              ? { convertedToTaskDates: reminder.convertedToTaskDates }
              : { convertedToTask: reminder.convertedToTask }
          )
        ));
        
        setTasks(tasksData);
        setMeetings(meetingsData);
        setReminders(cleanedReminders); // Use the cleaned reminders
        setJournals(journalsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Using local data instead.');
        
        // Fall back to localStorage if API fails
        setTasks(loadFromLocalStorage('tasks', []));
        setMeetings(loadFromLocalStorage('meetings', []));
        setReminders(loadFromLocalStorage('reminders', []));
        setJournals(loadFromLocalStorage('journals', []));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Save to localStorage as backup
  useEffect(() => {
    if (tasks.length > 0) saveToLocalStorage('tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    if (meetings.length > 0) saveToLocalStorage('meetings', meetings);
  }, [meetings]);

  useEffect(() => {
    if (reminders.length > 0) saveToLocalStorage('reminders', reminders);
  }, [reminders]);

  useEffect(() => {
    if (journals.length > 0) saveToLocalStorage('journals', journals);
  }, [journals]);
  
  // Clean up timer interval when component unmounts
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Task functions
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'timeSpent' | 'timers'>) => {
    try {
      const newTask = await TasksAPI.create(task);
      setTasks(prev => [...prev, newTask]);
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task');
      
      // Add to local state even if API fails
      const localTask: Task = {
        ...task,
        id: uuidv4(),
        createdAt: new Date(),
        timeSpent: 0,
        timers: []
      };
      setTasks(prev => [...prev, localTask]);
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await TasksAPI.update(taskId, updates);
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
      
      // Update local state even if API fails
      setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updates } : task));
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    // Find the task first to check if it's linked to a reminder
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Check if this task was converted from a reminder
    const reminderToReset = task.convertedFromReminder ? 
      reminders.find(r => r.id === task.convertedFromReminder) : null;
    
    try {
      // Delete the task
      await TasksAPI.delete(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      // If this task was linked to a reminder, reset the reminder's conversion status
      if (reminderToReset) {
        const today = new Date(currentDate);
        today.setHours(0, 0, 0, 0);
        
        const updates: Partial<Reminder> = reminderToReset.recurring
          ? {
              // For recurring reminders, remove today's date from convertedToTaskDates
              convertedToTaskDates: (reminderToReset.convertedToTaskDates || []).filter(date => {
                const convertedDate = new Date(date);
                convertedDate.setHours(0, 0, 0, 0);
                return convertedDate.getTime() !== today.getTime();
              })
            }
          : { 
              // For non-recurring reminders, reset convertedToTask flag
              convertedToTask: false 
            };
        
        // Also reset completion status if the task was completed
        if (task.completed) {
          if (reminderToReset.recurring) {
            updates.completedInstances = (reminderToReset.completedInstances || []).filter(date => {
              const completedDate = new Date(date);
              completedDate.setHours(0, 0, 0, 0);
              return completedDate.getTime() !== today.getTime();
            });
          } else {
            updates.completed = false;
          }
        }
        
        const updatedReminder = await RemindersAPI.update(reminderToReset.id, updates);
        setReminders(prev => prev.map(r => 
          r.id === reminderToReset.id ? updatedReminder : r
        ));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
      
      // Delete from local state even if API fails
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Also try to reset the reminder locally if API fails
      if (reminderToReset) {
        const today = new Date(currentDate);
        today.setHours(0, 0, 0, 0);
        
        setReminders(prev => prev.map(r => 
          r.id === reminderToReset.id 
            ? { 
                ...r, 
                ...(r.recurring 
                  ? {
                      convertedToTaskDates: (r.convertedToTaskDates || []).filter(date => {
                        const convertedDate = new Date(date);
                        convertedDate.setHours(0, 0, 0, 0);
                        return convertedDate.getTime() !== today.getTime();
                      }),
                      completedInstances: task.completed 
                        ? (r.completedInstances || []).filter(date => {
                            const completedDate = new Date(date);
                            completedDate.setHours(0, 0, 0, 0);
                            return completedDate.getTime() !== today.getTime();
                          })
                        : r.completedInstances
                    }
                  : { 
                      convertedToTask: false,
                      completed: task.completed ? false : r.completed
                    }
                )
              } 
            : r
        ));
      }
    }
  }, [tasks, reminders, currentDate]);

  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    try {
      const updatedTask = await TasksAPI.update(taskId, { 
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : undefined
      });
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      
      // If this task was converted from a reminder, update the reminder status accordingly
      if (task.convertedFromReminder) {
        const associatedReminder = reminders.find(r => r.id === task.convertedFromReminder);
        
        if (associatedReminder) {
          if (task.completed) {
            // Task was uncompleted, reset the reminder status for recurring reminders
            if (associatedReminder.recurring) {
              // For recurring reminders, remove today from completedInstances if present
              // This allows the reminder to show up again on the next occurrence
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const updatedCompletedInstances = associatedReminder.completedInstances ? 
                associatedReminder.completedInstances.filter(date => {
                  const completedDate = new Date(date);
                  completedDate.setHours(0, 0, 0, 0);
                  return completedDate.getTime() !== today.getTime();
                }) : [];
              
              await RemindersAPI.update(associatedReminder.id, {
                completedInstances: updatedCompletedInstances,
                // For non-recurring reminders, keep convertedToTask true
                // This prevents creating duplicate tasks
              });
              
              // Update the reminders state
              setReminders(prev => prev.map(r => 
                r.id === associatedReminder.id ? 
                { ...r, completedInstances: updatedCompletedInstances } : r
              ));
            } else {
              // For non-recurring reminders, mark as not completed
              // But keep convertedToTask true
              await RemindersAPI.update(associatedReminder.id, {
                completed: false
              });
              
              // Update the reminders state
              setReminders(prev => prev.map(r => 
                r.id === associatedReminder.id ? { ...r, completed: false } : r
              ));
            }
          } else {
            // Task was completed, mark the reminder as completed or add today to completedInstances
            if (associatedReminder.recurring) {
              // For recurring reminders, add today to completedInstances
              const today = new Date();
              const completedInstances = associatedReminder.completedInstances || [];
              
              await RemindersAPI.update(associatedReminder.id, {
                completedInstances: [...completedInstances, today]
              });
              
              // Update the reminders state
              setReminders(prev => prev.map(r => 
                r.id === associatedReminder.id ? 
                { ...r, completedInstances: [...completedInstances, today] } : r
              ));
            } else {
              // For non-recurring reminders, mark as completed
              await RemindersAPI.update(associatedReminder.id, {
                completed: true
              });
              
              // Update the reminders state
              setReminders(prev => prev.map(r => 
                r.id === associatedReminder.id ? { ...r, completed: true } : r
              ));
            }
          }
        }
      }
    } catch (err) {
      console.error('Error toggling task completion:', err);
      setError('Failed to update task');
      
      // Update local state even if API fails
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        completed: !t.completed,
        completedAt: !t.completed ? new Date() : undefined
      } : t));
      
      // Also try to update the reminder state locally if API fails
      if (task.convertedFromReminder) {
        const associatedReminder = reminders.find(r => r.id === task.convertedFromReminder);
        if (associatedReminder) {
          if (associatedReminder.recurring) {
            const today = new Date();
            const completedInstances = associatedReminder.completedInstances || [];
            
            if (task.completed) {
              // Remove today from completedInstances
              setReminders(prev => prev.map(r => 
                r.id === associatedReminder.id ? 
                { 
                  ...r, 
                  completedInstances: completedInstances.filter(date => {
                    const completedDate = new Date(date);
                    completedDate.setHours(0, 0, 0, 0);
                    return completedDate.getTime() !== today.setHours(0, 0, 0, 0);
                  }) 
                } : r
              ));
            } else {
              // Add today to completedInstances
              setReminders(prev => prev.map(r => 
                r.id === associatedReminder.id ? 
                { ...r, completedInstances: [...completedInstances, today] } : r
              ));
            }
          } else {
            // For non-recurring reminders, toggle completed status
            setReminders(prev => prev.map(r => 
              r.id === associatedReminder.id ? { ...r, completed: !task.completed } : r
            ));
          }
        }
      }
    }
  }, [tasks, reminders]);

  // Meeting functions
  const addMeeting = useCallback(async (meeting: Omit<Meeting, 'id'>) => {
    try {
      const newMeeting = await MeetingsAPI.create(meeting);
      setMeetings(prev => [...prev, newMeeting]);
    } catch (err) {
      console.error('Error adding meeting:', err);
      setError('Failed to add meeting');
      
      // Add to local state even if API fails
      const localMeeting: Meeting = {
        ...meeting,
        id: uuidv4()
      };
      setMeetings(prev => [...prev, localMeeting]);
    }
  }, []);

  const updateMeeting = useCallback(async (meetingId: string, updates: Partial<Meeting>) => {
    try {
      const updatedMeeting = await MeetingsAPI.update(meetingId, updates);
      setMeetings(prev => prev.map(meeting => meeting.id === meetingId ? updatedMeeting : meeting));
    } catch (err) {
      console.error('Error updating meeting:', err);
      setError('Failed to update meeting');
      
      // Update local state even if API fails
      setMeetings(prev => prev.map(meeting => meeting.id === meetingId ? { ...meeting, ...updates } : meeting));
    }
  }, []);

  const deleteMeeting = useCallback(async (meetingId: string) => {
    try {
      await MeetingsAPI.delete(meetingId);
      setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
    } catch (err) {
      console.error('Error deleting meeting:', err);
      setError('Failed to delete meeting');
      
      // Delete from local state even if API fails
      setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
    }
  }, []);

  const toggleMeetingCompletion = useCallback(async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    
    try {
      const updatedMeeting = await MeetingsAPI.update(meetingId, { completed: !meeting.completed });
      setMeetings(prev => prev.map(m => m.id === meetingId ? updatedMeeting : m));
    } catch (err) {
      console.error('Error toggling meeting completion:', err);
      setError('Failed to update meeting');
      
      // Update local state even if API fails
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, completed: !m.completed } : m));
    }
  }, [meetings]);

  // Reminder functions
  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id'>) => {
    try {
      const newReminder = await RemindersAPI.create(reminder);
      setReminders(prev => [...prev, newReminder]);
    } catch (err) {
      console.error('Error adding reminder:', err);
      setError('Failed to add reminder');
      
      // Add to local state even if API fails
      const localReminder: Reminder = {
        ...reminder,
        id: uuidv4()
      };
      setReminders(prev => [...prev, localReminder]);
    }
  }, []);

  const updateReminder = useCallback(async (reminderId: string, updates: Partial<Reminder>) => {
    try {
      const updatedReminder = await RemindersAPI.update(reminderId, updates);
      setReminders(prev => prev.map(reminder => reminder.id === reminderId ? updatedReminder : reminder));
    } catch (err) {
      console.error('Error updating reminder:', err);
      setError('Failed to update reminder');
      
      // Update local state even if API fails
      setReminders(prev => prev.map(reminder => reminder.id === reminderId ? { ...reminder, ...updates } : reminder));
    }
  }, []);

  const deleteReminder = useCallback(async (reminderId: string) => {
    try {
      await RemindersAPI.delete(reminderId);
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setError('Failed to delete reminder');
      
      // Delete from local state even if API fails
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
    }
  }, []);

  const toggleReminderCompletion = useCallback(async (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;
    
    try {
      const updatedReminder = await RemindersAPI.update(reminderId, { completed: !reminder.completed });
      setReminders(prev => prev.map(r => r.id === reminderId ? updatedReminder : r));
    } catch (err) {
      console.error('Error toggling reminder completion:', err);
      setError('Failed to update reminder');
      
      // Update local state even if API fails
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, completed: !r.completed } : r));
    }
  }, [reminders]);

  // Timer functions
  const startTimer = useCallback((taskId: string) => {
    setActiveTaskId(taskId);
    setCurrentTimer(0);
    
    // Start the timer
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
    }
    
    const startTime = Date.now();
    const timerId = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setCurrentTimer(elapsedSeconds);
    }, 1000);
    
    timerIntervalRef.current = timerId;
  }, []);

  const stopTimer = useCallback(async (taskId: string) => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const timerSession: TimerSession = {
      id: uuidv4(),
      startTime: new Date(Date.now() - currentTimer * 1000),
      endTime: new Date(),
      duration: currentTimer
    };
    
    const updatedTimers = [...task.timers, timerSession];
    const updatedTimeSpent = task.timeSpent + currentTimer;
    
    try {
      await updateTask(taskId, {
        timers: updatedTimers,
        timeSpent: updatedTimeSpent
      });
    } catch (err) {
      console.error('Error saving timer session:', err);
    }
    
    setActiveTaskId(null);
    setCurrentTimer(0);
  }, [currentTimer, tasks, updateTask]);

  // Convert a reminder to a task
  const convertReminderToTask = useCallback(async (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;
    
    try {
      // Create a new task based on the reminder
      const newTask = {
        title: reminder.title,
        description: reminder.description,
        priority: 'medium' as const,
        completed: false,
        // Use current date for the due date instead of reminder date
        dueDate: new Date(), 
        convertedFromReminder: reminder.id
      };
      
      // Add the task
      const createdTask = await TasksAPI.create(newTask);
      setTasks(prev => [...prev, createdTask]);
      
      // For recurring reminders, store the conversion date instead of a boolean
      const today = new Date(currentDate);
      today.setHours(0, 0, 0, 0);
      
      const updates: Partial<Reminder> = reminder.recurring
        ? {
            convertedToTaskDates: [...(reminder.convertedToTaskDates || []), today.toISOString()]
          }
        : { convertedToTask: true };
      
      // Update the reminder to mark it as converted
      const updatedReminder = await RemindersAPI.update(reminderId, updates);
      
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? updatedReminder : r
      ));
      
    } catch (err) {
      console.error('Error converting reminder to task:', err);
      setError('Failed to convert reminder to task');
      
      // Fallback to local state if API fails
      const newTask: Task = {
        id: uuidv4(),
        title: reminder.title,
        description: reminder.description,
        priority: 'medium',
        completed: false,
        createdAt: new Date(),
        // Use current date for the due date instead of reminder date
        dueDate: new Date(),
        timeSpent: 0,
        timers: [],
        convertedFromReminder: reminder.id
      };
      
      const today = new Date(currentDate);
      today.setHours(0, 0, 0, 0);
      
      setTasks(prev => [...prev, newTask]);
      setReminders(prev => prev.map(r => 
        r.id === reminderId 
          ? { 
              ...r, 
              ...(r.recurring 
                ? { convertedToTaskDates: [...(r.convertedToTaskDates || []), today.toISOString()] }
                : { convertedToTask: true }
              )
            } 
          : r
      ));
    }
  }, [reminders, currentDate]);

  // Helper function to check if a reminder can be converted to task
  const canConvertReminderToTask = useCallback((reminder: Reminder): boolean => {
    // Get today's date with time set to midnight
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    
    // For non-recurring reminders, also check if the date is today
    if (!reminder.recurring) {
      const reminderDate = new Date(reminder.date);
      reminderDate.setHours(0, 0, 0, 0);
      
      // If the reminder is not for today, we can't convert it
      if (reminderDate.getTime() !== today.getTime()) {
        return false;
      }
      
      // If it's already been converted, we can't convert it again
      if (reminder.convertedToTask) {
        return false;
      }
    }
    
    // Find any task that was created from this reminder today
    const hasTaskForToday = tasks.some(task => {
      // Check if the task was created from this reminder
      if (task.convertedFromReminder !== reminder.id) {
        return false;
      }
      
      // Check if the task was created today
      const taskDate = new Date(task.createdAt);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    // Can convert if there's no task for today
    return !hasTaskForToday;
  }, [currentDate, tasks]);

  // Journal functions
  const addJournal = useCallback(async (journal: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newJournal = await JournalsAPI.create(journal);
      setJournals(prev => [...prev, newJournal]);
    } catch (err) {
      console.error('Error adding journal:', err);
      setError('Failed to add journal');
      
      // Add to local state even if API fails
      const localJournal: Journal = {
        ...journal,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setJournals(prev => [...prev, localJournal]);
    }
  }, []);

  const updateJournal = useCallback(async (journalId: string, updates: Partial<Journal>) => {
    try {
      // Find the current journal
      const currentJournal = journals.find(j => j.id === journalId);
      if (!currentJournal) return;
      
      // Check if there are actual changes to save
      let hasChanges = false;
      
      for (const key in updates) {
        if (key === 'updatedAt') continue; // Ignore updatedAt changes
        
        const typedKey = key as keyof Journal;
        if (typedKey === 'tags') {
          // Special handling for arrays
          const currentTags = currentJournal.tags || [];
          const newTags = updates.tags || [];
          
          if (JSON.stringify(currentTags) !== JSON.stringify(newTags)) {
            hasChanges = true;
            break;
          }
        } else if (updates[typedKey] !== currentJournal[typedKey]) {
          hasChanges = true;
          break;
        }
      }
      
      if (!hasChanges) {
        // No actual changes, skip API call
        return;
      }
      
      const updatedJournal = await JournalsAPI.update(journalId, updates);
      setJournals(prev => prev.map(journal => journal.id === journalId ? updatedJournal : journal));
    } catch (err) {
      console.error('Error updating journal:', err);
      setError('Failed to update journal');
      
      // Update local state even if API fails
      setJournals(prev => prev.map(journal => journal.id === journalId ? { 
        ...journal, 
        ...updates, 
        updatedAt: new Date() 
      } : journal));
    }
  }, [journals]);

  const deleteJournal = useCallback(async (journalId: string) => {
    try {
      await JournalsAPI.delete(journalId);
      setJournals(prev => prev.filter(journal => journal.id !== journalId));
    } catch (err) {
      console.error('Error deleting journal:', err);
      setError('Failed to delete journal');
      
      // Delete from local state even if API fails
      setJournals(prev => prev.filter(journal => journal.id !== journalId));
    }
  }, []);

  const searchJournals = useCallback(async (query: string): Promise<Journal[]> => {
    try {
      return await JournalsAPI.search(query);
    } catch (err) {
      console.error('Error searching journals:', err);
      setError('Failed to search journals');
      
      // Local search fallback
      return journals.filter(journal => 
        journal.title.toLowerCase().includes(query.toLowerCase()) || 
        journal.content.toLowerCase().includes(query.toLowerCase()) ||
        (journal.tags && journal.tags.some(tag => 
          tag.toLowerCase().includes(query.toLowerCase())))
      );
    }
  }, [journals]);

  return (
    <AppContext.Provider
      value={{
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
        convertReminderToTask,
        
        journals,
        addJournal,
        updateJournal,
        deleteJournal,
        searchJournals,
        
        startTimer,
        stopTimer,
        activeTaskId,
        currentTimer,
        
        currentDate,
        setCurrentDate,
        
        isLoading,
        error,
        
        canConvertReminderToTask
      }}
    >
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