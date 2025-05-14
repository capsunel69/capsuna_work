import connectToDatabase from './utils/db.js';
import Note from './models/Note.js';

exports.handler = async (event, context) => {
  // Make the database connection available for reuse
  context.callbackWaitsForEmptyEventLoop = false;
  
  console.log(`Notes API: ${event.httpMethod} ${event.path}`);
  
  try {
    // Connect to database
    const db = await connectToDatabase();
    console.log('Database connection established');
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        // Get the first note (we only need one)
        console.log('Getting the sticky note');
        const note = await Note.findOne();
        console.log('Note found:', note);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note || { content: '' })
        };
      
      case 'POST':
        // Create or update the note
        const noteData = JSON.parse(event.body);
        console.log('Creating/updating note:', JSON.stringify(noteData));
        
        // Try to find existing note first
        let existingNote = await Note.findOne();
        
        if (existingNote) {
          // Update existing note
          existingNote.content = noteData.content;
          existingNote.updatedAt = new Date();
          const updatedNote = await existingNote.save();
          console.log('Note updated');
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedNote)
          };
        } else {
          // Create new note
          const newNote = new Note(noteData);
          const savedNote = await newNote.save();
          console.log('New note created');
          return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(savedNote)
          };
        }
      
      default:
        // Method not allowed
        console.log(`Method not allowed: ${event.httpMethod}`);
        return {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
}; 