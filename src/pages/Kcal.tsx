import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styled from 'styled-components';
import { format, subDays } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Progman34, User, Shell32169, FolderFile, Mmsys113, FilePick, Shell325, Progman40, Shell321, Earth, Computer, Wordpad, FileText } from '@react95/icons';
import { FormContainer, FormRow, FormRowHorizontal, ButtonRow } from '../components/shared/FormStyles';

// Register the required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Styled components to match Windows 98 theme
const PageContainer = styled.div`
  padding: 0;
  height: 100%;
`;

const PageTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 20px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const TabHeader = styled.div`
  display: flex;
  border-bottom: 1px solid #868a8e;
  margin-bottom: 16px;
`;

const TabButton = styled.button<{ isActive: boolean }>`
  font-size: 14px;
  padding: 8px 16px;
  margin-right: 4px;
  background: ${props => props.isActive 
    ? 'linear-gradient(to bottom, #e3e3e3, #c0c0c0)' 
    : 'linear-gradient(to bottom, #cfcfcf, #a0a0a0)'};
  border: 1px solid #868a8e;
  border-bottom: ${props => props.isActive ? '1px solid #c0c0c0' : '1px solid #868a8e'};
  border-radius: 4px 4px 0 0;
  position: relative;
  bottom: -1px;
  cursor: pointer;
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.isActive 
      ? 'linear-gradient(to bottom, #e3e3e3, #c0c0c0)' 
      : 'linear-gradient(to bottom, #d8d8d8, #b0b0b0)'};
  }
`;

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 1.05rem;
`;

const Input = styled.input`
  width: 100%;
  height: 38px;
  padding: 8px 12px;
  font-size: 1.05rem;
  border: 1px solid #ccc;
  box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  
  &:focus {
    border-color: #0066cc;
    outline: none;
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(0, 102, 204, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 8px 12px;
  font-size: 1.05rem;
  border: 1px solid #ccc;
  box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  resize: vertical;
  
  &:focus {
    border-color: #0066cc;
    outline: none;
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(0, 102, 204, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  height: 38px;
  padding: 8px 12px;
  font-size: 1.05rem;
  border: 1px solid #ccc;
  box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  background-color: white;
  
  &:focus {
    border-color: #0066cc;
    outline: none;
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(0, 102, 204, 0.2);
  }
`;


const AlertMessage = styled.div<{ variant: 'success' | 'error' | 'info' }>`
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 1.05rem;
  border: 1px solid;
  border-color: ${props => 
    props.variant === 'success' ? '#4caf50' : 
    props.variant === 'error' ? '#f44336' : '#2196f3'
  };
  background-color: ${props => 
    props.variant === 'success' ? '#e8f5e9' : 
    props.variant === 'error' ? '#ffebee' : '#e3f2fd'
  };
  color: ${props => 
    props.variant === 'success' ? '#2e7d32' : 
    props.variant === 'error' ? '#c62828' : '#0d47a1'
  };
  display: flex;
  align-items: center;
  gap: 10px;
  
  &:before {
    content: '';
    display: block;
    width: 24px;
    height: 24px;
    background-color: ${props => 
      props.variant === 'success' ? '#4caf50' : 
      props.variant === 'error' ? '#f44336' : '#2196f3'
    };
    mask-image: ${props => 
      props.variant === 'success' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\'/%3E%3C/svg%3E")' : 
      props.variant === 'error' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z\'/%3E%3C/svg%3E")' : 
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z\'/%3E%3C/svg%3E")'
    };
  }
`;

const PrimaryButton = styled.button`
  background: linear-gradient(to bottom, #4f94ea, #3a7bd5);
  color: white;
  font-size: 1.05rem;
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #2c5ea9;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
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

const DeleteButton = styled.button`
  background: linear-gradient(to bottom, #f96c6c, #e53e3e);
  color: white;
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #c53030;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: linear-gradient(to bottom, #ff8080, #f05252);
  }
  
  &:active {
    background: #e53e3e;
  }
`;

const ChartContainer = styled.div`
  background: white;
  padding: 16px;
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
  border-radius: 4px;
  height: 400px;
  margin-bottom: 16px;
`;

const DataListContainer = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888, 0 3px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background-color: #fff;
  margin-bottom: 24px;
`;

const DataListHeader = styled.div`
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    background: linear-gradient(to bottom, #f0f0f0, #e1e1e1);
    padding: 10px;
    border: 1px solid #dfdfdf;
    text-align: left;
    font-weight: bold;
  }
  
  td {
    padding: 10px;
    border: 1px solid #dfdfdf;
    background-color: white;
  }
  
  tr:nth-child(even) td {
    background-color: #f8f8f8;
  }
`;

const Badge = styled.span<{ variant: string }>`
  padding: 3px 8px;
  font-size: 0.85rem;
  border-radius: 3px;
  background-color: ${props => 
    props.variant === 'success' ? '#4caf50' : 
    props.variant === 'warning' ? '#ff9800' : '#f44336'
  };
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const FilterContainer = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f8f8;
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
  border-radius: 4px;
  display: flex;
  gap: 16px;
  align-items: center;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 20px;
  font-size: 1.1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  
  &:before {
    content: '';
    display: block;
    width: 24px;
    height: 24px;
    border: 3px solid #3a7bd5;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: linear-gradient(to bottom, #f0f0f0, #e1e1e1);
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin: 8px 0;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #666;
  text-align: center;
`;

// Add a modal component for editing
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #c0c0c0;
  border: 1px solid #868a8e;
  box-shadow: 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888;
  border-radius: 1px;
  width: 90%;
  max-width: 600px;
  padding: 2px;
`;

const ModalHeader = styled.div`
  background: linear-gradient(to right, #000080, #1084d0);
  color: white;
  padding: 6px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
`;

const ModalBody = styled.div`
  padding: 16px;
  background-color: #c0c0c0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const SecondaryButton = styled.button`
  background: linear-gradient(to bottom, #e3e3e3, #c0c0c0);
  border: 1px solid #868a8e;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: linear-gradient(to bottom, #f0f0f0, #d0d0d0);
  }
  
  &:active {
    background: #c0c0c0;
  }
`;

const EditButton = styled.button`
  background: linear-gradient(to bottom, #4f94ea, #3a7bd5);
  color: white;
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #2c5ea9;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
  
  &:hover {
    background: linear-gradient(to bottom, #5ca0ff, #4485e6);
  }
  
  &:active {
    background: #3a7bd5;
  }
`;

// Define TypeScript interfaces
interface KcalEntry {
  id: string;
  date: string;
  caloriesEaten: number;
  weight: number;
  feeling: 'good' | 'moderate' | 'bad';
  caloriesBurned: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    yAxisID: string;
    spanGaps?: boolean;
  }[];
}

const Kcal: React.FC = () => {
  // State for form inputs
  const [formData, setFormData] = useState<Omit<KcalEntry, 'id' | 'createdAt' | 'updatedAt'>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    caloriesEaten: 0,
    weight: 0,
    feeling: 'moderate',
    caloriesBurned: 0,
    notes: '',
  });
  
  // State for entries
  const [entries, setEntries] = useState<KcalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'entry' | 'visualization' | 'history'>('entry');
  
  // State for date range filter
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');
  
  // Add new state for editing
  const [editingEntry, setEditingEntry] = useState<KcalEntry | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<KcalEntry, 'id' | 'createdAt' | 'updatedAt'>>({
    date: '',
    caloriesEaten: 0,
    weight: 0,
    feeling: 'moderate',
    caloriesBurned: 0,
    notes: '',
  });
  
  // Load entries on component mount
  useEffect(() => {
    fetchEntries();
  }, [dateRange]);
  
  // Fetch entries based on date range
  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/.netlify/functions/kcal';
      
      // Add date range filters
      if (dateRange === 'week') {
        // Get last 7 days ending with yesterday
        const end = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        const start = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        url += `?startDate=${start}&endDate=${end}`;
      } else if (dateRange === 'month') {
        // Get last 30 days ending with yesterday
        const end = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        const start = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        url += `?startDate=${start}&endDate=${end}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      setEntries(data);
    } catch (err) {
      console.error('Error fetching kcal entries:', err);
      setError('Failed to load entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'caloriesEaten' || name === 'weight' || name === 'caloriesBurned' 
        ? parseFloat(value) || 0 
        : value,
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const entryData: KcalEntry = {
        ...formData,
        id: uuidv4(),
      };
      
      const response = await fetch('/.netlify/functions/kcal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const savedEntry = await response.json();
      
      // Update the entries list
      setEntries(prev => [savedEntry, ...prev]);
      
      // Reset form
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        caloriesEaten: 0,
        weight: 0,
        feeling: 'moderate',
        caloriesBurned: 0,
        notes: '',
      });
      
      setSuccessMessage('Entry saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving kcal entry:', err);
      setError('Failed to save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete an entry
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/.netlify/functions/kcal/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      // Remove entry from state
      setEntries(prev => prev.filter(entry => entry.id !== id));
      setSuccessMessage('Entry deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting kcal entry:', err);
      setError('Failed to delete entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate stats from entries
  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    
    // Get the latest entry for weight
    const latestEntry = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    // Calculate averages
    const avgCaloriesEaten = entries.reduce((sum, entry) => sum + entry.caloriesEaten, 0) / entries.length;
    const avgCaloriesBurned = entries.reduce((sum, entry) => sum + entry.caloriesBurned, 0) / entries.length;
    
    // Count feelings
    const feelings = {
      good: entries.filter(e => e.feeling === 'good').length,
      moderate: entries.filter(e => e.feeling === 'moderate').length,
      bad: entries.filter(e => e.feeling === 'bad').length,
    };
    
    return {
      latestWeight: latestEntry.weight,
      avgCaloriesEaten: Math.round(avgCaloriesEaten),
      avgCaloriesBurned: Math.round(avgCaloriesBurned),
      dominantFeeling: Object.entries(feelings).sort((a, b) => b[1] - a[1])[0][0],
      totalEntries: entries.length,
    };
  }, [entries]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    if (entries.length === 0) return { labels: [], datasets: [] };

    // Create an array of the last 7 days (if week view)
    let dates: Date[] = [];
    if (dateRange === 'week') {
      for (let i = 7; i > 0; i--) {
        dates.push(subDays(new Date(), i));
      }
    } else if (dateRange === 'month') {
      for (let i = 30; i > 0; i--) {
        dates.push(subDays(new Date(), i));
      }
    } else {
      // For 'all' range, use the actual entry dates
      dates = [...entries].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }).map(entry => new Date(entry.date));
    }

    // Create a map of entries by date string
    const entriesByDate = new Map(
      entries.map(entry => [format(new Date(entry.date), 'yyyy-MM-dd'), entry])
    );

    // Create arrays for each metric, filling in nulls for missing dates
    const labels = dates.map(date => format(date, 'MM/dd/yyyy'));
    const caloriesEaten = dates.map(date => {
      const entry = entriesByDate.get(format(date, 'yyyy-MM-dd'));
      return entry ? entry.caloriesEaten : null;
    });
    const weights = dates.map(date => {
      const entry = entriesByDate.get(format(date, 'yyyy-MM-dd'));
      return entry ? entry.weight : null;
    });
    const caloriesBurned = dates.map(date => {
      const entry = entriesByDate.get(format(date, 'yyyy-MM-dd'));
      return entry ? entry.caloriesBurned : null;
    });

    // Create dataset for each metric
    const data: ChartData = {
      labels,
      datasets: [
        {
          label: 'Calories Eaten',
          data: caloriesEaten,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          yAxisID: 'y',
          spanGaps: true, // This will connect points across null values
        },
        {
          label: 'Weight (kg)',
          data: weights,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1,
          yAxisID: 'y1',
          spanGaps: true,
        },
        {
          label: 'Calories Burned',
          data: caloriesBurned,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          yAxisID: 'y',
          spanGaps: true,
        },
      ],
    };
    
    return data;
  }, [entries, dateRange]);
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Health Metrics Over Time',
        font: {
          family: 'MS Sans Serif, sans-serif',
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Calories',
        },
        grid: {
          display: true,
        },
      },
      y1: {
        beginAtZero: false,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Weight (kg)',
        },
        grid: {
          display: false, // Prevents grid line overlap
        },
      },
    },
  };
  
  // Handle edit form input changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'caloriesEaten' || name === 'weight' || name === 'caloriesBurned' 
        ? parseFloat(value) || 0 
        : value,
    }));
  };
  
  // Open edit modal
  const handleEditClick = (entry: KcalEntry) => {
    setEditingEntry(entry);
    setEditFormData({
      date: format(new Date(entry.date), 'yyyy-MM-dd'),
      caloriesEaten: entry.caloriesEaten,
      weight: entry.weight,
      feeling: entry.feeling,
      caloriesBurned: entry.caloriesBurned,
      notes: entry.notes,
    });
  };
  
  // Close edit modal
  const handleCloseEdit = () => {
    setEditingEntry(null);
  };
  
  // Update an entry
  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEntry) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedEntry: KcalEntry = {
        ...editFormData,
        id: editingEntry.id,
        createdAt: editingEntry.createdAt,
        updatedAt: new Date().toISOString(),
      };
      
      const response = await fetch(`/.netlify/functions/kcal/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEntry),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const savedEntry = await response.json();
      
      // Update the entries list
      setEntries(prev => prev.map(entry => 
        entry.id === savedEntry.id ? savedEntry : entry
      ));
      
      setSuccessMessage('Entry updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Close modal
      handleCloseEdit();
    } catch (err) {
      console.error('Error updating kcal entry:', err);
      setError('Failed to update entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageContainer>
      {/* Add the edit modal */}
      {editingEntry && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wordpad variant="32x32_4" /> Edit Health Entry
              </div>
              <SecondaryButton onClick={handleCloseEdit} style={{ padding: '2px 6px' }}>✕</SecondaryButton>
            </ModalHeader>
            <ModalBody>
              {error && <AlertMessage variant="error">{error}</AlertMessage>}
              
              <form onSubmit={handleUpdateEntry}>
                <FormRowHorizontal>
                  <FormGroup>
                    <Label htmlFor="edit-date">Date</Label>
                    <Input
                      type="date"
                      id="edit-date"
                      name="date"
                      value={editFormData.date}
                      onChange={handleEditInputChange}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="edit-weight">Weight (kg)</Label>
                    <Input
                      type="number"
                      id="edit-weight"
                      step="0.1"
                      name="weight"
                      value={editFormData.weight}
                      onChange={handleEditInputChange}
                      required
                    />
                  </FormGroup>
                </FormRowHorizontal>
                
                <FormRowHorizontal>
                  <FormGroup>
                    <Label htmlFor="edit-caloriesEaten">Calories Eaten</Label>
                    <Input
                      type="number"
                      id="edit-caloriesEaten"
                      name="caloriesEaten"
                      value={editFormData.caloriesEaten}
                      onChange={handleEditInputChange}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="edit-caloriesBurned">Calories Burned</Label>
                    <Input
                      type="number"
                      id="edit-caloriesBurned"
                      name="caloriesBurned"
                      value={editFormData.caloriesBurned}
                      onChange={handleEditInputChange}
                      required
                    />
                  </FormGroup>
                </FormRowHorizontal>
                
                <FormRow>
                  <Label htmlFor="edit-feeling">Overall Feeling</Label>
                  <Select
                    id="edit-feeling"
                    name="feeling"
                    value={editFormData.feeling}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="good">Good</option>
                    <option value="moderate">Moderate</option>
                    <option value="bad">Bad</option>
                  </Select>
                </FormRow>
                
                <FormRow>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <TextArea
                    id="edit-notes"
                    rows={3}
                    name="notes"
                    value={editFormData.notes}
                    onChange={handleEditInputChange}
                  />
                </FormRow>
                
                <ButtonGroup>
                  <SecondaryButton type="button" onClick={handleCloseEdit}>
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Entry'}
                    <FileText variant="32x32_4" />
                  </PrimaryButton>
                </ButtonGroup>
              </form>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
      
      <PageTitle>
        <Shell321 variant="32x32_4" /> Health Tracker
      </PageTitle>
      
      <TabContainer>
        <TabHeader>
          <TabButton 
            isActive={activeTab === 'entry'} 
            onClick={() => setActiveTab('entry')}
          >
            <FilePick variant="32x32_4" /> New Entry
          </TabButton>
          <TabButton 
            isActive={activeTab === 'visualization'} 
            onClick={() => setActiveTab('visualization')}
          >
            <Mmsys113 variant="32x32_4" /> Visualizations
          </TabButton>
          <TabButton 
            isActive={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
          >
            <Shell325 variant="32x32_4" /> History
          </TabButton>
        </TabHeader>
        
        <TabContent>
          {activeTab === 'entry' && (
            <FormContainer>
              {error && <AlertMessage variant="error">{error}</AlertMessage>}
              {successMessage && <AlertMessage variant="success">{successMessage}</AlertMessage>}
              
              <form onSubmit={handleSubmit}>
                <FormRowHorizontal>
                  <FormGroup>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      type="number"
                      id="weight"
                      step="0.1"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                </FormRowHorizontal>
                
                <FormRowHorizontal>
                  <FormGroup>
                    <Label htmlFor="caloriesEaten">Calories Eaten</Label>
                    <Input
                      type="number"
                      id="caloriesEaten"
                      name="caloriesEaten"
                      value={formData.caloriesEaten}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="caloriesBurned">Calories Burned</Label>
                    <Input
                      type="number"
                      id="caloriesBurned"
                      name="caloriesBurned"
                      value={formData.caloriesBurned}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                </FormRowHorizontal>
                
                <FormRow>
                  <Label htmlFor="feeling">Overall Feeling</Label>
                  <Select
                    id="feeling"
                    name="feeling"
                    value={formData.feeling}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="good">Good</option>
                    <option value="moderate">Moderate</option>
                    <option value="bad">Bad</option>
                  </Select>
                </FormRow>
                
                <FormRow>
                  <Label htmlFor="notes">Notes</Label>
                  <TextArea
                    id="notes"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </FormRow>
                
                <ButtonRow>
                  <PrimaryButton 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Entry'}
                    <FolderFile variant="32x32_4" />
                  </PrimaryButton>
                </ButtonRow>
              </form>
            </FormContainer>
          )}
          
          {activeTab === 'visualization' && (
            <>
              <FilterContainer>
                <Label htmlFor="dateRange">Time Range:</Label>
                <Select
                  id="dateRange"
                  value={dateRange}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDateRange(e.target.value as 'week' | 'month' | 'all')}
                  style={{ width: '200px' }}
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">All Time</option>
                </Select>
              </FilterContainer>
              
              {loading ? (
                <LoadingIndicator>Loading data...</LoadingIndicator>
              ) : entries.length > 0 ? (
                <>
                  {stats && (
                    <StatsContainer>
                      <StatCard>
                        <Progman40 variant="32x32_4" />
                        <StatValue>{stats.latestWeight} kg</StatValue>
                        <StatLabel>Current Weight</StatLabel>
                      </StatCard>
                      
                      <StatCard>
                        <User variant="32x32_4" />
                        <StatValue>{stats.avgCaloriesEaten}</StatValue>
                        <StatLabel>Avg. Calories Eaten</StatLabel>
                      </StatCard>
                      
                      <StatCard>
                        <Computer variant="32x32_4" />
                        <StatValue>{stats.avgCaloriesBurned}</StatValue>
                        <StatLabel>Avg. Calories Burned</StatLabel>
                      </StatCard>
                      
                      <StatCard>
                        <Earth variant="32x32_4" />
                        <StatValue style={{ textTransform: 'capitalize' }}>{stats.dominantFeeling}</StatValue>
                        <StatLabel>Dominant Feeling</StatLabel>
                      </StatCard>
                    </StatsContainer>
                  )}
                  
                  <ChartContainer>
                    <Line data={chartData} options={chartOptions} />
                  </ChartContainer>
                </>
              ) : (
                <AlertMessage variant="info">No data available for the selected time range.</AlertMessage>
              )}
            </>
          )}
          
          {activeTab === 'history' && (
            <>
              <FilterContainer>
                <Label htmlFor="historyDateRange">Time Range:</Label>
                <Select
                  id="historyDateRange"
                  value={dateRange}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDateRange(e.target.value as 'week' | 'month' | 'all')}
                  style={{ width: '200px' }}
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">All Time</option>
                </Select>
              </FilterContainer>
              
              {loading ? (
                <LoadingIndicator>Loading data...</LoadingIndicator>
              ) : entries.length > 0 ? (
                <DataListContainer>
                  <DataListHeader>
                    <div>Health Entries ({entries.length})</div>
                  </DataListHeader>
                  <div className="table-responsive">
                    <Table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Weight (kg)</th>
                          <th>Calories Eaten</th>
                          <th>Calories Burned</th>
                          <th>Feeling</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{format(new Date(entry.date), 'MM/dd/yyyy')}</td>
                            <td>{entry.weight}</td>
                            <td>{entry.caloriesEaten}</td>
                            <td>{entry.caloriesBurned}</td>
                            <td>
                              <Badge
                                variant={
                                  entry.feeling === 'good' ? 'success' : 
                                  entry.feeling === 'moderate' ? 'warning' : 'error'
                                }
                              >
                                {entry.feeling === 'good' && <Earth variant="32x32_4" />}
                                {entry.feeling === 'moderate' && <Shell32169 variant="32x32_4" />}
                                {entry.feeling === 'bad' && <Progman34 variant="32x32_4" />}
                                {entry.feeling}
                              </Badge>
                            </td>
                            <td style={{ display: 'flex', gap: '4px' }}>
                              <EditButton
                                onClick={() => handleEditClick(entry)}
                              >
                                Edit
                              </EditButton>
                              <DeleteButton
                                onClick={() => handleDelete(entry.id)}
                              >
                                Delete
                              </DeleteButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </DataListContainer>
              ) : (
                <AlertMessage variant="info">No entries found for the selected time range.</AlertMessage>
              )}
            </>
          )}
        </TabContent>
      </TabContainer>
    </PageContainer>
  );
};

export default Kcal; 