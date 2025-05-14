import connectToDatabase from './utils/db.js';

export const handler = async (event, context) => {
  // Make the database connection available for reuse
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Try to connect to the database
    console.log('Health check: Testing database connection');
    const connection = await connectToDatabase();
    const connectionState = connection.connection.readyState;
    
    // MongoDB readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const status = connectionState === 1 ? 'connected' : 'disconnected';
    const dbName = connection.connection.db.databaseName;
    
    console.log(`Database connection status: ${status}, database name: ${dbName}`);
    
    // List collections to verify we have access
    let collections = [];
    try {
      collections = await connection.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name).join(', '));
    } catch (err) {
      console.error('Error listing collections:', err);
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          status,
          connectionState,
          databaseName: dbName,
          collections: collections.map(c => c.name)
        }
      })
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        message: 'Failed to connect to database',
        error: error.message,
        stack: error.stack
      })
    };
  }
}; 