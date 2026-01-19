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

// netlify/functions/journals.js
var journals_exports = {};
__export(journals_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(journals_exports);

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

// netlify/functions/models/Journal.js
var import_mongoose2 = __toESM(require("mongoose"), 1);
var JournalSchema = new import_mongoose2.default.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ""
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String
  }]
}, {
  collection: "journals",
  timestamps: true
  // This will automatically update the updatedAt field
});
JournalSchema.index({
  title: "text",
  content: "text",
  tags: "text"
});
var Journal = import_mongoose2.default.models.Journal || import_mongoose2.default.model("Journal", JournalSchema);
var Journal_default = Journal;

// netlify/functions/journals.js
var handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(`Journals API: ${event.httpMethod} ${event.path}`);
  try {
    const db = await db_default();
    console.log("Database connection established");
    switch (event.httpMethod) {
      case "GET":
        if (event.path.includes("/search")) {
          const params = new URLSearchParams(event.queryStringParameters);
          const query = params.get("q");
          console.log(`Searching journals with query: ${query}`);
          if (!query) {
            return {
              statusCode: 400,
              body: JSON.stringify({ message: "Search query is required" })
            };
          }
          let journals;
          if (query.length < 3) {
            journals = await Journal_default.find({
              $or: [
                { title: { $regex: query, $options: "i" } },
                { content: { $regex: query, $options: "i" } },
                { tags: { $in: [new RegExp(query, "i")] } }
              ]
            });
          } else {
            journals = await Journal_default.find(
              { $text: { $search: query } },
              { score: { $meta: "textScore" } }
            ).sort({ score: { $meta: "textScore" } });
          }
          console.log(`Found ${journals.length} journals matching the query`);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(journals)
          };
        } else if (event.path === "/.netlify/functions/journals") {
          console.log("Getting all journals");
          const journals = await Journal_default.find();
          console.log(`Found ${journals.length} journals`);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(journals)
          };
        } else {
          const id = event.path.split("/").pop();
          console.log(`Getting journal with ID: ${id}`);
          const journal = await Journal_default.findOne({ id });
          if (!journal) {
            console.log(`Journal not found with ID: ${id}`);
            return {
              statusCode: 404,
              body: JSON.stringify({ message: "Journal not found" })
            };
          }
          console.log("Journal found:", journal.title);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(journal)
          };
        }
      case "POST":
        const journalData = JSON.parse(event.body);
        console.log("Creating new journal:", JSON.stringify(journalData));
        const newJournal = new Journal_default(journalData);
        console.log("Journal model created, saving to database...");
        const savedJournal = await newJournal.save();
        console.log("Journal saved to database with ID:", savedJournal.id);
        return {
          statusCode: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedJournal)
        };
      case "PUT":
        const updateId = event.path.split("/").pop();
        const updateData = JSON.parse(event.body);
        console.log(`Updating journal ${updateId}:`, JSON.stringify(updateData));
        const updatedJournal = await Journal_default.findOneAndUpdate(
          { id: updateId },
          updateData,
          { new: true }
        );
        if (!updatedJournal) {
          console.log(`Journal not found for update with ID: ${updateId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: "Journal not found" })
          };
        }
        console.log("Journal updated:", updatedJournal.title);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedJournal)
        };
      case "DELETE":
        const deleteId = event.path.split("/").pop();
        console.log(`Deleting journal with ID: ${deleteId}`);
        const deletedJournal = await Journal_default.findOneAndDelete({ id: deleteId });
        if (!deletedJournal) {
          console.log(`Journal not found for deletion with ID: ${deleteId}`);
          return {
            statusCode: 404,
            body: JSON.stringify({ message: "Journal not found" })
          };
        }
        console.log("Journal deleted successfully");
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Journal deleted" })
        };
      default:
        console.log(`Method not allowed: ${event.httpMethod}`);
        return {
          statusCode: 405,
          body: JSON.stringify({ message: "Method not allowed" })
        };
    }
  } catch (error) {
    console.error("Error in journals function:", error);
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
//# sourceMappingURL=journals.js.map
