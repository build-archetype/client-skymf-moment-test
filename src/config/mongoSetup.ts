import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;

export async function setupMongoDB() {
  const mongoUri = process.env.MONGODB_URL;

  if (!mongoUri) {
    throw new Error("MONGODB_URL is missing in environment variables");
  }

  console.log("MongoDB URI:", mongoUri); // Log the URI for debugging

  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();

  return mongoClient.db();
}

export async function closeMongoDB() {
  if (mongoClient) {
    await mongoClient.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

let cachedClient: MongoClient | null = null;

export async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URL!);

  cachedClient = client;
  return client;
}
