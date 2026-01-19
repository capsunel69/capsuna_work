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

// netlify/functions/health.js
var health_exports = {};
__export(health_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(health_exports);

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

// netlify/functions/health.js
var handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    console.log("Health check: Testing database connection");
    const connection = await db_default();
    const connectionState = connection.connection.readyState;
    const status = connectionState === 1 ? "connected" : "disconnected";
    const dbName = connection.connection.db.databaseName;
    console.log(`Database connection status: ${status}, database name: ${dbName}`);
    let collections = [];
    try {
      collections = await connection.connection.db.listCollections().toArray();
      console.log("Available collections:", collections.map((c) => c.name).join(", "));
    } catch (err) {
      console.error("Error listing collections:", err);
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: {
          status,
          connectionState,
          databaseName: dbName,
          collections: collections.map((c) => c.name)
        }
      })
    };
  } catch (error) {
    console.error("Health check error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "error",
        message: "Failed to connect to database",
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
//# sourceMappingURL=health.js.map
