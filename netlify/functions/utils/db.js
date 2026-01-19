import mongoose from 'mongoose';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  // Debug: Log all env vars starting with REACT_APP or MONGODB (without values for security)
  console.log('Available env vars:', Object.keys(process.env).filter(k => 
    k.includes('MONGO') || k.includes('REACT_APP')
  ));
  
  // Get MongoDB URI from environment
  const mongoUri = process.env.REACT_APP_MONGODB_URI;
  
  // Debug logging
  console.log('REACT_APP_MONGODB_URI exists:', !!mongoUri);
  console.log('REACT_APP_MONGODB_URI type:', typeof mongoUri);
  console.log('REACT_APP_MONGODB_URI length:', mongoUri ? mongoUri.length : 0);
  
  // Validate URI exists and is a non-empty string
  if (!mongoUri || typeof mongoUri !== 'string' || mongoUri.trim() === '') {
    const error = new Error(
      'REACT_APP_MONGODB_URI environment variable is not set or is empty. ' +
      'Please configure it in your Netlify dashboard under Site settings > Environment variables. ' +
      `Current value type: ${typeof mongoUri}, truthy: ${!!mongoUri}`
    );
    console.error(error.message);
    throw error;
  }

  // Validate URI format
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    const error = new Error(
      `Invalid MongoDB URI format. URI must start with 'mongodb://' or 'mongodb+srv://'. ` +
      `Got: ${mongoUri.substring(0, 20)}...`
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
    console.log('MongoDB URI (masked):', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    
    const conn = await mongoose.connect(mongoUri, options);
    cachedDb = conn;
    console.log('MongoDB connected successfully to database:', conn.connection.db.databaseName);
    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

export default connectToDatabase; 