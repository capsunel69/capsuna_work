var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// netlify/functions/models/Note.js
var import_mongoose2 = __toESM(require("mongoose"), 1);
var NoteSchema = new import_mongoose2.default.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    default: ""
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: "notes",
  timestamps: true
});
var Note = import_mongoose2.default.models.Note || import_mongoose2.default.model("Note", NoteSchema);
var Note_default = Note;

// netlify/functions/notes.js
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(`Notes API: ${event.httpMethod} ${event.path}`);
  try {
    const db = await db_default();
    console.log("Database connection established");
    switch (event.httpMethod) {
      case "GET":
        console.log("Getting the sticky note");
        const note = await Note_default.findOne();
        console.log("Note found:", note);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(note || { content: "" })
        };
      case "POST":
        const noteData = JSON.parse(event.body);
        console.log("Creating/updating note:", JSON.stringify(noteData));
        let existingNote = await Note_default.findOne();
        if (existingNote) {
          existingNote.content = noteData.content;
          existingNote.updatedAt = /* @__PURE__ */ new Date();
          const updatedNote = await existingNote.save();
          console.log("Note updated");
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedNote)
          };
        } else {
          const newNote = new Note_default(noteData);
          const savedNote = await newNote.save();
          console.log("New note created");
          return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(savedNote)
          };
        }
      default:
        console.log(`Method not allowed: ${event.httpMethod}`);
        return {
          statusCode: 405,
          body: JSON.stringify({ message: "Method not allowed" })
        };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error: error.message })
    };
  }
};
//# sourceMappingURL=notes.js.map
