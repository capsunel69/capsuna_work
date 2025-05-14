import connectToDatabase from './utils/db.js';
import Reminder from './models/Reminder.js';

export const handler = async (event, context) => {
  // Make the database connection available for reuse
  context.callbackWaitsForEmptyEventLoop = false;
  
  console.log(`Reminders API: ${event.httpMethod} ${event.path}`);
  
  try {
    // Connect to database
    const db = await connectToDatabase();
    console.log('Database connection established');
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        if (event.path === '/.netlify/functions/reminders') {
          // Get all reminders
          console.log('Getting all reminders');
          const reminders = await Reminder.find();
          console.log(`Found ${reminders.length} reminders`);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reminders)
          };
        } else {
          // Get single reminder by ID (from path parameter)
          const id = event.path.split('/').pop();
          console.log(`Getting reminder with ID: ${id}`);
          const reminder = await Reminder.findOne({ id });
          
          if (!reminder) {
            console.log(`Reminder not found with ID: ${id}`);
            return {
              statusCode: 404,
              body: JSON.stringify({ message: 'Reminder not found' })
            };
          }
          
          console.log('Reminder found:', reminder.title);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reminder)
          };
        }
      
      case 'POST':
        // Create a new reminder
        const reminderData = JSON.parse(event.body);
        console.log('Creating new reminder:', JSON.stringify(reminderData));
        
        const newReminder = new Reminder(reminderData);
        console.log('Reminder model created, saving to database...');
        
        const savedReminder = await newReminder.save();
        console.log('Reminder saved to database with ID:', savedReminder.id);
        
        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedReminder)
        };
      
      case 'PUT':
        // Update a reminder
        const updateId = event.path.split('/').pop();
        const updateData = JSON.parse(event.body);
        console.log(`Updating reminder ${updateId}:`, JSON.stringify(updateData));
        
        const updatedReminder = await Reminder.findOneAndUpdate(
          { id: updateId },
          updateData,
          { new: true }
        );
        
        if (!updatedReminder) {
          console.log(`Reminder not found for update with ID: ${updateId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Reminder not found' })
          };
        }
        
        console.log('Reminder updated:', updatedReminder.title);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedReminder)
        };
      
      case 'DELETE':
        // Delete a reminder
        const deleteId = event.path.split('/').pop();
        console.log(`Deleting reminder with ID: ${deleteId}`);
        
        const deletedReminder = await Reminder.findOneAndDelete({ id: deleteId });
        
        if (!deletedReminder) {
          console.log(`Reminder not found for deletion with ID: ${deleteId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Reminder not found' })
          };
        }
        
        console.log('Reminder deleted successfully');
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Reminder deleted' })
        };
      
      default:
        // Method not allowed
        console.log(`Method not allowed: ${event.httpMethod}`);
        return {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error in reminders function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Server error', 
        error: error.message,
        stack: error.stack 
      })
    };
  }
}; 