import mongoose from 'mongoose';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  // Get MongoDB URI from environment
  const mongoUri = process.env.REACT_APP_MONGODB_URI;
  
  // Validate URI exists
  if (!mongoUri) {
    const error = new Error(
      'REACT_APP_MONGODB_URI environment variable is not set. ' +
      'Please configure it in your Netlify dashboard under Site settings > Environment variables.'
    );
    console.error(error.message);
    throw error;
  }

  // Connection options
  const options = {
    dbName: 'capsuna_work' // Explicitly set the database name
  };

  try {
    console.log('Connecting to MongoDB...');
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