import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String
  }]
}, {
  collection: 'journals',
  timestamps: true  // This will automatically update the updatedAt field
});

// Create a text index for searching
JournalSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
});

// Use existing model if it exists, otherwise create a new one
const Journal = mongoose.models.Journal || mongoose.model('Journal', JournalSchema);

export default Journal; 