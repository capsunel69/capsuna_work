import mongoose from 'mongoose';

const TimerSessionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    required: true,
    default: 0
  }
});

const TaskSchema = new mongoose.Schema({
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
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  timers: [TimerSessionSchema]
}, {
  collection: 'tasks',
  timestamps: true
});

// Use existing model if it exists, otherwise create a new one
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

export default Task; 