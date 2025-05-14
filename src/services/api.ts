import type { Task, Meeting, Reminder, Journal } from '../types';

// Use import.meta.env instead of process.env for Vite
const API_URL = import.meta.env.VITE_API_URL || '/.netlify/functions';

/**
 * Generic API fetch function
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}/${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(url, {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API request failed with status ${response.status}`);
  }
  
  return response.json();
}

// Tasks API
export const TasksAPI = {
  getAll: (): Promise<Task[]> => fetchApi<Task[]>('tasks'),
  
  getById: (id: string): Promise<Task> => fetchApi<Task>(`tasks/${id}`),
  
  create: (task: Omit<Task, 'id' | 'createdAt' | 'timeSpent' | 'timers'>): Promise<Task> => 
    fetchApi<Task>('tasks', {
      method: 'POST',
      body: JSON.stringify({
        ...task,
        id: crypto.randomUUID(), // Generate id on client side
        createdAt: new Date(),
        timeSpent: 0,
        timers: []
      }),
    }),
  
  update: (id: string, updates: Partial<Task>): Promise<Task> => 
    fetchApi<Task>(`tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string): Promise<{ message: string }> => 
    fetchApi<{ message: string }>(`tasks/${id}`, {
      method: 'DELETE',
    }),
};

// Meetings API
export const MeetingsAPI = {
  getAll: (): Promise<Meeting[]> => fetchApi<Meeting[]>('meetings'),
  
  getById: (id: string): Promise<Meeting> => fetchApi<Meeting>(`meetings/${id}`),
  
  create: (meeting: Omit<Meeting, 'id'>): Promise<Meeting> => 
    fetchApi<Meeting>('meetings', {
      method: 'POST',
      body: JSON.stringify({
        ...meeting,
        id: crypto.randomUUID(), // Generate id on client side
      }),
    }),
  
  update: (id: string, updates: Partial<Meeting>): Promise<Meeting> => 
    fetchApi<Meeting>(`meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string): Promise<{ message: string }> => 
    fetchApi<{ message: string }>(`meetings/${id}`, {
      method: 'DELETE',
    }),
};

// Reminders API
export const RemindersAPI = {
  getAll: (): Promise<Reminder[]> => fetchApi<Reminder[]>('reminders'),
  
  getById: (id: string): Promise<Reminder> => fetchApi<Reminder>(`reminders/${id}`),
  
  create: (reminder: Omit<Reminder, 'id'>): Promise<Reminder> => 
    fetchApi<Reminder>('reminders', {
      method: 'POST',
      body: JSON.stringify({
        ...reminder,
        id: crypto.randomUUID(), // Generate id on client side
      }),
    }),
  
  update: (id: string, updates: Partial<Reminder>): Promise<Reminder> => 
    fetchApi<Reminder>(`reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string): Promise<{ message: string }> => 
    fetchApi<{ message: string }>(`reminders/${id}`, {
      method: 'DELETE',
    }),
};

// Journals API
export const JournalsAPI = {
  getAll: (): Promise<Journal[]> => fetchApi<Journal[]>('journals'),
  
  getById: (id: string): Promise<Journal> => fetchApi<Journal>(`journals/${id}`),
  
  create: (journal: Omit<Journal, 'id' | 'createdAt'>): Promise<Journal> => 
    fetchApi<Journal>('journals', {
      method: 'POST',
      body: JSON.stringify({
        ...journal,
        id: crypto.randomUUID(), // Generate id on client side
        createdAt: new Date(),
        updatedAt: new Date()
      }),
    }),
  
  update: (id: string, updates: Partial<Journal>): Promise<Journal> => 
    fetchApi<Journal>(`journals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updates,
        updatedAt: new Date()
      }),
    }),
  
  delete: (id: string): Promise<{ message: string }> => 
    fetchApi<{ message: string }>(`journals/${id}`, {
      method: 'DELETE',
    }),
    
  search: (query: string): Promise<Journal[]> => 
    fetchApi<Journal[]>(`journals/search?q=${encodeURIComponent(query)}`),
}; 