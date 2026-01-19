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

// netlify/functions/reminders.js
var reminders_exports = {};
__export(reminders_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(reminders_exports);

// netlify/functions/utils/db.js
var import_mongoose = __toESM(require("mongoose"), 1);
var cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const mongoUri = process.env.REACT_APP_MONGODB_URI;
  if (!mongoUri) {
    const error = new Error(
      "REACT_APP_MONGODB_URI environment variable is not set. Please configure it in your Netlify dashboard under Site settings > Environment variables."
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
    console.log("MongoDB URI:", mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@"));
    const conn = await import_mongoose.default.connect(mongoUri, options);
    cachedDb = conn;
    console.log("MongoDB connected successfully to database:", conn.connection.db.databaseName);
    return cachedDb;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
var db_default = connectToDatabase;

// netlify/functions/models/Reminder.js
var import_mongoose2 = __toESM(require("mongoose"), 1);
var RecurringConfigSchema = new import_mongoose2.default.Schema({
  type: {
    type: String,
    enum: ["weekly", "monthly"],
    required: true
  },
  subtype: {
    type: String,
    enum: ["dayOfMonth", "relativeDay"]
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31
  },
  weekNum: {
    type: Number,
    enum: [1, 2, 3, 4, -1]
    // First, Second, Third, Fourth, Last
  },
  time: {
    type: String
  }
});
var ReminderSchema = new import_mongoose2.default.Schema({
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
  date: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  recurring: {
    type: String,
    enum: ["", "daily", "weekly", "monthly"],
    default: ""
  },
  recurringConfig: {
    type: RecurringConfigSchema
  },
  convertedToTask: {
    type: Boolean,
    default: false
  },
  convertedToTaskDates: {
    type: [String],
    default: []
  },
  completedInstances: {
    type: [Date],
    default: []
  }
}, {
  collection: "reminders",
  // Explicitly set collection name
  timestamps: true
  // Adds createdAt and updatedAt timestamps
});
var Reminder = import_mongoose2.default.models.Reminder || import_mongoose2.default.model("Reminder", ReminderSchema);
var Reminder_default = Reminder;

// netlify/functions/reminders.js
var handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(`Reminders API: ${event.httpMethod} ${event.path}`);
  try {
    const db = await db_default();
    console.log("Database connection established");
    switch (event.httpMethod) {
      case "GET":
        if (event.path === "/.netlify/functions/reminders") {
          console.log("Getting all reminders");
          const reminders = await Reminder_default.find();
          console.log(`Found ${reminders.length} reminders`);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reminders)
          };
        } else {
          const id = event.path.split("/").pop();
          console.log(`Getting reminder with ID: ${id}`);
          const reminder = await Reminder_default.findOne({ id });
          if (!reminder) {
            console.log(`Reminder not found with ID: ${id}`);
            return {
              statusCode: 404,
              body: JSON.stringify({ message: "Reminder not found" })
            };
          }
          console.log("Reminder found:", reminder.title);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reminder)
          };
        }
      case "POST":
        const reminderData = JSON.parse(event.body);
        console.log("Creating new reminder:", JSON.stringify(reminderData));
        const newReminder = new Reminder_default(reminderData);
        console.log("Reminder model created, saving to database...");
        const savedReminder = await newReminder.save();
        console.log("Reminder saved to database with ID:", savedReminder.id);
        return {
          statusCode: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedReminder)
        };
      case "PUT":
        const updateId = event.path.split("/").pop();
        const updateData = JSON.parse(event.body);
        console.log(`Updating reminder ${updateId}:`, JSON.stringify(updateData));
        const updatedReminder = await Reminder_default.findOneAndUpdate(
          { id: updateId },
          updateData,
          { new: true }
        );
        if (!updatedReminder) {
          console.log(`Reminder not found for update with ID: ${updateId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: "Reminder not found" })
          };
        }
        console.log("Reminder updated:", updatedReminder.title);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedReminder)
        };
      case "DELETE":
        const deleteId = event.path.split("/").pop();
        console.log(`Deleting reminder with ID: ${deleteId}`);
        const deletedReminder = await Reminder_default.findOneAndDelete({ id: deleteId });
        if (!deletedReminder) {
          console.log(`Reminder not found for deletion with ID: ${deleteId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: "Reminder not found" })
          };
        }
        console.log("Reminder deleted successfully");
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Reminder deleted" })
        };
      default:
        console.log(`Method not allowed: ${event.httpMethod}`);
        return {
          statusCode: 405,
          body: JSON.stringify({ message: "Method not allowed" })
        };
    }
  } catch (error) {
    console.error("Error in reminders function:", error);
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
//# sourceMappingURL=reminders.js.map
