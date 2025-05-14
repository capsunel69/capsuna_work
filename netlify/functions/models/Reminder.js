import mongoose from 'mongoose';

const RecurringConfigSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true
  },
  subtype: {
    type: String,
    enum: ['dayOfMonth', 'relativeDay'],
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31
  },
  weekNum: {
    type: Number,
    enum: [1, 2, 3, 4, -1]  // First, Second, Third, Fourth, Last
  },
  time: {
    type: String
  }
});

const ReminderSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  recurring: {
    type: String,
    enum: ['', 'daily', 'weekly', 'monthly'],
    default: ''
  },
  recurringConfig: {
    type: RecurringConfigSchema
  },
  convertedToTask: {
    type: Boolean,
    default: false
  },
  convertedToTaskDates: {
    type: [String],
    default: []
  },
  completedInstances: {
    type: [Date],
    default: []
  }
}, {
  collection: 'reminders', // Explicitly set collection name
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Use existing model if it exists, otherwise create a new one
const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', ReminderSchema);

export default Reminder; 