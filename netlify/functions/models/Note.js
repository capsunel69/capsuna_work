import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'notes',
  timestamps: true
});

// Use existing model if it exists, otherwise create a new one
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

export default Note; 