import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  // Connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'capsuna_work' // Explicitly set the database name
  };

  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.REACT_APP_MONGODB_URI;
    console.log('MongoDB URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Log without password
    
    const conn = await mongoose.connect(mongoUri, options);
    cachedDb = conn;
    console.log('MongoDB connected successfully to database:', conn.connection.db.databaseName);
    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default connectToDatabase; 