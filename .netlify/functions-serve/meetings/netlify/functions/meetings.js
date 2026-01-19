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

// netlify/functions/meetings.js
var meetings_exports = {};
__export(meetings_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(meetings_exports);

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

// netlify/functions/models/Meeting.js
var import_mongoose2 = __toESM(require("mongoose"), 1);
var MeetingSchema = new import_mongoose2.default.Schema({
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
  duration: {
    type: Number,
    required: true,
    default: 30
    // in minutes
  },
  participants: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ""
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  collection: "meetings",
  // Explicitly set collection name
  timestamps: true
  // Adds createdAt and updatedAt timestamps
});
var Meeting = import_mongoose2.default.models.Meeting || import_mongoose2.default.model("Meeting", MeetingSchema);
var Meeting_default = Meeting;

// netlify/functions/meetings.js
var handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(`Meetings API: ${event.httpMethod} ${event.path}`);
  try {
    const db = await db_default();
    console.log("Database connection established");
    switch (event.httpMethod) {
      case "GET":
        if (event.path === "/.netlify/functions/meetings") {
          console.log("Getting all meetings");
          const meetings = await Meeting_default.find();
          console.log(`Found ${meetings.length} meetings`);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meetings)
          };
        } else {
          const id = event.path.split("/").pop();
          console.log(`Getting meeting with ID: ${id}`);
          const meeting = await Meeting_default.findOne({ id });
          if (!meeting) {
            console.log(`Meeting not found with ID: ${id}`);
            return {
              statusCode: 404,
              body: JSON.stringify({ message: "Meeting not found" })
            };
          }
          console.log("Meeting found:", meeting.title);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meeting)
          };
        }
      case "POST":
        const meetingData = JSON.parse(event.body);
        console.log("Creating new meeting:", JSON.stringify(meetingData));
        const newMeeting = new Meeting_default(meetingData);
        console.log("Meeting model created, saving to database...");
        const savedMeeting = await newMeeting.save();
        console.log("Meeting saved to database with ID:", savedMeeting.id);
        return {
          statusCode: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedMeeting)
        };
      case "PUT":
        const updateId = event.path.split("/").pop();
        const updateData = JSON.parse(event.body);
        console.log(`Updating meeting ${updateId}:`, JSON.stringify(updateData));
        const updatedMeeting = await Meeting_default.findOneAndUpdate(
          { id: updateId },
          updateData,
          { new: true }
        );
        if (!updatedMeeting) {
          console.log(`Meeting not found for update with ID: ${updateId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: "Meeting not found" })
          };
        }
        console.log("Meeting updated:", updatedMeeting.title);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedMeeting)
        };
      case "DELETE":
        const deleteId = event.path.split("/").pop();
        console.log(`Deleting meeting with ID: ${deleteId}`);
        const deletedMeeting = await Meeting_default.findOneAndDelete({ id: deleteId });
        if (!deletedMeeting) {
          console.log(`Meeting not found for deletion with ID: ${deleteId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: "Meeting not found" })
          };
        }
        console.log("Meeting deleted successfully");
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Meeting deleted" })
        };
      default:
        console.log(`Method not allowed: ${event.httpMethod}`);
        return {
          statusCode: 405,
          body: JSON.stringify({ message: "Method not allowed" })
        };
    }
  } catch (error) {
    console.error("Error in meetings function:", error);
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
//# sourceMappingURL=meetings.js.map
