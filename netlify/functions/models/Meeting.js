import mongoose from 'mongoose';

const MeetingSchema = new mongoose.Schema({
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
  duration: {
    type: Number,
    required: true,
    default: 30 // in minutes
  },
  participants: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'meetings', // Explicitly set collection name
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Use existing model if it exists, otherwise create a new one
const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

export default Meeting; 