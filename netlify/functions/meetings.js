import connectToDatabase from './utils/db.js';
import Meeting from './models/Meeting.js';

export const handler = async (event, context) => {
  // Make the database connection available for reuse
  context.callbackWaitsForEmptyEventLoop = false;
  
  console.log(`Meetings API: ${event.httpMethod} ${event.path}`);
  
  try {
    // Connect to database
    const db = await connectToDatabase();
    console.log('Database connection established');
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        if (event.path === '/.netlify/functions/meetings') {
          // Get all meetings
          console.log('Getting all meetings');
          const meetings = await Meeting.find();
          console.log(`Found ${meetings.length} meetings`);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meetings)
          };
        } else {
          // Get single meeting by ID (from path parameter)
          const id = event.path.split('/').pop();
          console.log(`Getting meeting with ID: ${id}`);
          const meeting = await Meeting.findOne({ id });
          
          if (!meeting) {
            console.log(`Meeting not found with ID: ${id}`);
            return {
              statusCode: 404,
              body: JSON.stringify({ message: 'Meeting not found' })
            };
          }
          
          console.log('Meeting found:', meeting.title);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meeting)
          };
        }
      
      case 'POST':
        // Create a new meeting
        const meetingData = JSON.parse(event.body);
        console.log('Creating new meeting:', JSON.stringify(meetingData));
        
        const newMeeting = new Meeting(meetingData);
        console.log('Meeting model created, saving to database...');
        
        const savedMeeting = await newMeeting.save();
        console.log('Meeting saved to database with ID:', savedMeeting.id);
        
        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedMeeting)
        };
      
      case 'PUT':
        // Update a meeting
        const updateId = event.path.split('/').pop();
        const updateData = JSON.parse(event.body);
        console.log(`Updating meeting ${updateId}:`, JSON.stringify(updateData));
        
        const updatedMeeting = await Meeting.findOneAndUpdate(
          { id: updateId },
          updateData,
          { new: true }
        );
        
        if (!updatedMeeting) {
          console.log(`Meeting not found for update with ID: ${updateId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Meeting not found' })
          };
        }
        
        console.log('Meeting updated:', updatedMeeting.title);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedMeeting)
        };
      
      case 'DELETE':
        // Delete a meeting
        const deleteId = event.path.split('/').pop();
        console.log(`Deleting meeting with ID: ${deleteId}`);
        
        const deletedMeeting = await Meeting.findOneAndDelete({ id: deleteId });
        
        if (!deletedMeeting) {
          console.log(`Meeting not found for deletion with ID: ${deleteId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Meeting not found' })
          };
        }
        
        console.log('Meeting deleted successfully');
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Meeting deleted' })
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
    console.error('Error in meetings function:', error);
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