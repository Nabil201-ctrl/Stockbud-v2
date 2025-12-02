import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

// Use cached connection if it exists
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err) {
      cached.promise = null; // retry on next call
    }
  }

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    socketTimeoutMS: 60000,
  };

  const maxAttempts = 3;
  let attempt = 0;

  const tryConnect = async (): Promise<typeof mongoose> => {
    attempt++;
    try {
      return await mongoose.connect(MONGODB_URI, opts);
    } catch (err) {
      if (attempt >= maxAttempts) throw err;
      const delay = 500 * Math.pow(2, attempt); // exponential backoff
      await new Promise((res) => setTimeout(res, delay));
      return tryConnect();
    }
  };

  cached.promise = tryConnect()
    .then((m) => m)
    .catch((e) => {
      cached.promise = null;
      throw e;
    });

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
