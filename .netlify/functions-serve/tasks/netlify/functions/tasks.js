var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/tasks.js
var tasks_exports = {};
__export(tasks_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(tasks_exports);

// netlify/functions/utils/db.js
var import_mongoose = __toESM(require("mongoose"), 1);
var cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  console.log("Available env vars:", Object.keys(process.env).filter(
    (k) => k.includes("MONGO") || k.includes("REACT_APP")
  ));
  const mongoUri = process.env.REACT_APP_MONGODB_URI;
  console.log("REACT_APP_MONGODB_URI exists:", !!mongoUri);
  console.log("REACT_APP_MONGODB_URI type:", typeof mongoUri);
  console.log("REACT_APP_MONGODB_URI length:", mongoUri ? mongoUri.length : 0);
  if (!mongoUri || typeof mongoUri !== "string" || mongoUri.trim() === "") {
    const error = new Error(
      `REACT_APP_MONGODB_URI environment variable is not set or is empty. Please configure it in your Netlify dashboard under Site settings > Environment variables. Current value type: ${typeof mongoUri}, truthy: ${!!mongoUri}`
    );
    console.error(error.message);
    throw error;
  }
  if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
    const error = new Error(
      `Invalid MongoDB URI format. URI must start with 'mongodb://' or 'mongodb+srv://'. Got: ${mongoUri.substring(0, 20)}...`
    );
    console.error(error.message);
    throw error;
  }
  const options = {
    dbName: "capsuna_work"
    // Explicitly set the database name
  };
  try {
    console.log("Connecting to MongoDB...");
    console.log("MongoDB URI (masked):", mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@"));
    const conn = await import_mongoose.default.connect(mongoUri, options);
    cachedDb = conn;
    console.log("MongoDB connected successfully to database:", conn.connection.db.databaseName);
    return cachedDb;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}
var db_default = connectToDatabase;

// netlify/functions/models/Task.js
var import_mongoose2 = __toESM(require("mongoose"), 1);
var TimerSessionSchema = new import_mongoose2.default.Schema({
  id: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    required: true,
    default: 0
  }
});
var TaskSchema = new import_mongoose2.default.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  dueDate: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  timers: [TimerSessionSchema],
  convertedFromReminder: {
    type: String,
    default: null
  }
}, {
  collection: "tasks",
  timestamps: true
});
var Task = import_mongoose2.default.models.Task || import_mongoose2.default.model("Task", TaskSchema);
var Task_default = Task;

// netlify/functions/tasks.js
var handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(`Tasks API: ${event.httpMethod} ${event.path}`);
  try {
    const db = await db_default();
    console.log("Database connection established");
    switch (event.httpMethod) {
      case "GET":
        if (event.path === "/.netlify/functions/tasks") {
          console.log("Getting all tasks");
          const tasks = await Task_default.find();
          console.log(`Found ${tasks.length} tasks`);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tasks)
          };
        } else {
          const id = event.path.split("/").pop();
          console.log(`Getting task with ID: ${id}`);
          const task = await Task_default.findOne({ id });
          if (!task) {
            console.log(`Task not found with ID: ${id}`);
            return {
              statusCode: 404,
              body: JSON.stringify({ message: "Task not found" })
            };
          }
          console.log("Task found:", task.title);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task)
          };
        }
      case "POST":
        const taskData = JSON.parse(event.body);
        console.log("Creating new task:", JSON.stringify(taskData));
        const newTask = new Task_default(taskData);
        console.log("Task model created, saving to database...");
        const savedTask = await newTask.save();
        console.log("Task saved to database with ID:", savedTask.id);
        return {
          statusCode: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedTask)
        };
      case "PUT":
        const updateId = event.path.split("/").pop();
        const updateData = JSON.parse(event.body);
        console.log(`Updating task ${updateId}:`, JSON.stringify(updateData));
        const updatedTask = await Task_default.findOneAndUpdate(
          { id: updateId },
          updateData,
          { new: true }
        );
        if (!updatedTask) {
          console.log(`Task not found for update with ID: ${updateId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: "Task not found" })
          };
        }
        console.log("Task updated:", updatedTask.title);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTask)
        };
      case "DELETE":
        const deleteId = event.path.split("/").pop();
        console.log(`Deleting task with ID: ${deleteId}`);
        const deletedTask = await Task_default.findOneAndDelete({ id: deleteId });
        if (!deletedTask) {
          console.log(`Task not found for deletion with ID: ${deleteId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: "Task not found" })
          };
        }
        console.log("Task deleted successfully");
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Task deleted" })
        };
      default:
        console.log(`Method not allowed: ${event.httpMethod}`);
        return {
          statusCode: 405,
          body: JSON.stringify({ message: "Method not allowed" })
        };
    }
  } catch (error) {
    console.error("Error in tasks function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Server error",
        error: error.message,
        stack: error.stack
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=tasks.js.map
