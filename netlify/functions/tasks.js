import connectToDatabase from './utils/db.js';
import Task from './models/Task.js';

export const handler = async (event, context) => {
  // Make the database connection available for reuse
  context.callbackWaitsForEmptyEventLoop = false;
  
  console.log(`Tasks API: ${event.httpMethod} ${event.path}`);
  
  try {
    // Connect to database
    const db = await connectToDatabase();
    console.log('Database connection established');
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        if (event.path === '/.netlify/functions/tasks') {
          // Get all tasks
          console.log('Getting all tasks');
          const tasks = await Task.find();
          console.log(`Found ${tasks.length} tasks`);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tasks)
          };
        } else {
          // Get single task by ID (from path parameter)
          const id = event.path.split('/').pop();
          console.log(`Getting task with ID: ${id}`);
          const task = await Task.findOne({ id });
          
          if (!task) {
            console.log(`Task not found with ID: ${id}`);
            return {
              statusCode: 404,
              body: JSON.stringify({ message: 'Task not found' })
            };
          }
          
          console.log('Task found:', task.title);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
          };
        }
      
      case 'POST':
        // Create a new task
        const taskData = JSON.parse(event.body);
        console.log('Creating new task:', JSON.stringify(taskData));
        
        const newTask = new Task(taskData);
        console.log('Task model created, saving to database...');
        
        const savedTask = await newTask.save();
        console.log('Task saved to database with ID:', savedTask.id);
        
        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedTask)
        };
      
      case 'PUT':
        // Update a task
        const updateId = event.path.split('/').pop();
        const updateData = JSON.parse(event.body);
        console.log(`Updating task ${updateId}:`, JSON.stringify(updateData));
        
        const updatedTask = await Task.findOneAndUpdate(
          { id: updateId },
          updateData,
          { new: true }
        );
        
        if (!updatedTask) {
          console.log(`Task not found for update with ID: ${updateId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Task not found' })
          };
        }
        
        console.log('Task updated:', updatedTask.title);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTask)
        };
      
      case 'DELETE':
        // Delete a task
        const deleteId = event.path.split('/').pop();
        console.log(`Deleting task with ID: ${deleteId}`);
        
        const deletedTask = await Task.findOneAndDelete({ id: deleteId });
        
        if (!deletedTask) {
          console.log(`Task not found for deletion with ID: ${deleteId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Task not found' })
          };
        }
        
        console.log('Task deleted successfully');
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Task deleted' })
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
    console.error('Error in tasks function:', error);
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