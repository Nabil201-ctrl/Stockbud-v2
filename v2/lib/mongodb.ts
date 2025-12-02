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

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection attempt is already in-flight, reuse the promise
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      // if the in-flight attempt failed, clear it and continue to a fresh attempt
      cached.promise = null;
    }
  }

  // Mongoose connect options — increase timeouts and disable command buffering
  const opts = {
    bufferCommands: false,
    // increase server selection and connection timeouts to avoid transient network hiccups
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    // Mongoose 6+ defaults are fine for useNewUrlParser/useUnifiedTopology, but include for clarity
    useNewUrlParser: true as const,
    useUnifiedTopology: true as const,
  };

  // Wrap connect in a retry loop with exponential backoff. This helps bridge
  // temporary network blips or DNS propagation delays (useful for Atlas).
  const maxAttempts = 3;
  let attempt = 0;

  const tryConnect = async (): Promise<typeof mongoose> => {
    attempt++;
    try {
      return await mongoose.connect(MONGODB_URI, opts as any);
    } catch (err) {
      // if we've exhausted attempts, rethrow
      if (attempt >= maxAttempts) throw err;
      const delay = 500 * Math.pow(2, attempt); // 1s, 2s, 4s-ish
      // small delay before retrying
      await new Promise((res) => setTimeout(res, delay));
      return tryConnect();
    }
  };

  cached.promise = tryConnect()
    .then((m) => {
      return m;
    })
    .catch((e) => {
      // clear promise so future calls can retry
      cached.promise = null;
      throw e;
    });

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;