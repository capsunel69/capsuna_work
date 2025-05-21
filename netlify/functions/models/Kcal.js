import mongoose from 'mongoose';

const KcalSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  caloriesEaten: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  feeling: {
    type: String,
    enum: ['good', 'moderate', 'bad'],
    required: true
  },
  caloriesBurned: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  collection: 'kcal',
  timestamps: true
});

// Use existing model if it exists, otherwise create a new one
const Kcal = mongoose.models.Kcal || mongoose.model('Kcal', KcalSchema);

export default Kcal; 