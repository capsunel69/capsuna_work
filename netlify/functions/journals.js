import connectToDatabase from './utils/db.js';
import Journal from './models/Journal.js';

export const handler = async (event, context) => {
  // Make the database connection available for reuse
  context.callbackWaitsForEmptyEventLoop = false;
  
  console.log(`Journals API: ${event.httpMethod} ${event.path}`);
  
  try {
    // Connect to database
    const db = await connectToDatabase();
    console.log('Database connection established');
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        // Check if this is a search request
        if (event.path.includes('/search')) {
          const params = new URLSearchParams(event.queryStringParameters);
          const query = params.get('q');
          
          console.log(`Searching journals with query: ${query}`);
          
          if (!query) {
            return {
              statusCode: 400,
              body: JSON.stringify({ message: 'Search query is required' })
            };
          }
          
          // Use text search or regex if the query is too short for text search
          let journals;
          if (query.length < 3) {
            // Use regex for short queries as text search requires at least 3 characters
            journals = await Journal.find({
              $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } }
              ]
            });
          } else {
            // Use text search for longer queries
            journals = await Journal.find(
              { $text: { $search: query } },
              { score: { $meta: "textScore" } }
            ).sort({ score: { $meta: "textScore" } });
          }
          
          console.log(`Found ${journals.length} journals matching the query`);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(journals)
          };
        } else if (event.path === '/.netlify/functions/journals') {
          // Get all journals
          console.log('Getting all journals');
          const journals = await Journal.find();
          console.log(`Found ${journals.length} journals`);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(journals)
          };
        } else {
          // Get single journal by ID (from path parameter)
          const id = event.path.split('/').pop();
          console.log(`Getting journal with ID: ${id}`);
          const journal = await Journal.findOne({ id });
          
          if (!journal) {
            console.log(`Journal not found with ID: ${id}`);
            return {
              statusCode: 404,
              body: JSON.stringify({ message: 'Journal not found' })
            };
          }
          
          console.log('Journal found:', journal.title);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(journal)
          };
        }
      
      case 'POST':
        // Create a new journal
        const journalData = JSON.parse(event.body);
        console.log('Creating new journal:', JSON.stringify(journalData));
        
        const newJournal = new Journal(journalData);
        console.log('Journal model created, saving to database...');
        
        const savedJournal = await newJournal.save();
        console.log('Journal saved to database with ID:', savedJournal.id);
        
        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedJournal)
        };
      
      case 'PUT':
        // Update a journal
        const updateId = event.path.split('/').pop();
        const updateData = JSON.parse(event.body);
        console.log(`Updating journal ${updateId}:`, JSON.stringify(updateData));
        
        const updatedJournal = await Journal.findOneAndUpdate(
          { id: updateId },
          updateData,
          { new: true }
        );
        
        if (!updatedJournal) {
          console.log(`Journal not found for update with ID: ${updateId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Journal not found' })
          };
        }
        
        console.log('Journal updated:', updatedJournal.title);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedJournal)
        };
      
      case 'DELETE':
        // Delete a journal
        const deleteId = event.path.split('/').pop();
        console.log(`Deleting journal with ID: ${deleteId}`);
        
        const deletedJournal = await Journal.findOneAndDelete({ id: deleteId });
        
        if (!deletedJournal) {
          console.log(`Journal not found for deletion with ID: ${deleteId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Journal not found' })
          };
        }
        
        console.log('Journal deleted successfully');
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Journal deleted' })
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
    console.error('Error in journals function:', error);
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