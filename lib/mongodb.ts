import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // If we have a cached connection, verify it's still healthy
  if (cached.conn) {
    if (mongoose.connection.readyState === 1) {
      return cached.conn;
    } else {
      // Connection exists but is not open, reset cache to force reconnect
      console.log('⚠️ MongoDB connection lost, resetting cache...');
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Increased timeout for better stability in serverless environments
      connectTimeoutMS: 10000,
    };

    console.log('🚀 Initiating new MongoDB connection...');

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB connected successfully');
      return mongooseInstance;
    }).catch((err) => {
      console.error('❌ MongoDB connection failed:', err);
      cached.promise = null; // Reset promise on failure
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
