import connectToDatabase from './utils/db.js';
import Kcal from './models/Kcal.js';

export const handler = async (event, context) => {
  // Make the database connection available for reuse
  context.callbackWaitsForEmptyEventLoop = false;
  
  console.log(`Kcal API: ${event.httpMethod} ${event.path}`);
  
  try {
    // Connect to database
    const db = await connectToDatabase();
    console.log('Database connection established');
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        if (event.path === '/.netlify/functions/kcal') {
          // Get all kcal entries
          console.log('Getting all kcal entries');
          
          // Parse query parameters for filtering by date range
          const params = new URLSearchParams(event.queryStringParameters || {});
          const startDate = params.get('startDate');
          const endDate = params.get('endDate');
          
          let query = {};
          
          if (startDate && endDate) {
            query.date = {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            };
          } else if (startDate) {
            query.date = { $gte: new Date(startDate) };
          } else if (endDate) {
            query.date = { $lte: new Date(endDate) };
          }
          
          const entries = await Kcal.find(query).sort({ date: -1 });
          console.log(`Found ${entries.length} kcal entries`);
          
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entries)
          };
        } else {
          // Get single kcal entry by ID
          const id = event.path.split('/').pop();
          console.log(`Getting kcal entry with ID: ${id}`);
          
          const entry = await Kcal.findOne({ id });
          
          if (!entry) {
            console.log(`Kcal entry not found with ID: ${id}`);
            return {
              statusCode: 404,
              body: JSON.stringify({ message: 'Kcal entry not found' })
            };
          }
          
          console.log('Kcal entry found for date:', entry.date);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
          };
        }
      
      case 'POST':
        // Create a new kcal entry
        const kcalData = JSON.parse(event.body);
        console.log('Creating new kcal entry:', JSON.stringify(kcalData));
        
        const newEntry = new Kcal(kcalData);
        console.log('Kcal model created, saving to database...');
        
        const savedEntry = await newEntry.save();
        console.log('Kcal entry saved to database with ID:', savedEntry.id);
        
        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedEntry)
        };
      
      case 'PUT':
        // Update an existing kcal entry
        const id = event.path.split('/').pop();
        const updateData = JSON.parse(event.body);
        
        console.log(`Updating kcal entry with ID: ${id}`);
        console.log('Update data:', JSON.stringify(updateData));
        
        const updatedEntry = await Kcal.findOneAndUpdate(
          { id },
          updateData,
          { new: true, runValidators: true }
        );
        
        if (!updatedEntry) {
          console.log(`Kcal entry not found with ID: ${id}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Kcal entry not found' })
          };
        }
        
        console.log('Kcal entry updated successfully');
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEntry)
        };
      
      case 'DELETE':
        // Delete a kcal entry
        const deleteId = event.path.split('/').pop();
        console.log(`Deleting kcal entry with ID: ${deleteId}`);
        
        const deleteResult = await Kcal.findOneAndDelete({ id: deleteId });
        
        if (!deleteResult) {
          console.log(`Kcal entry not found with ID: ${deleteId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Kcal entry not found' })
          };
        }
        
        console.log('Kcal entry deleted successfully');
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Kcal entry deleted successfully' })
        };
      
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }
  } catch (error) {
    console.error('Error in kcal API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
}; 