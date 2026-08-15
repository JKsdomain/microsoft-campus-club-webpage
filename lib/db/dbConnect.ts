import fs from "fs";
import path from "path";
import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

const cached: MongooseCache = global.mongooseCache;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/^MONGODB_URI\s*=\s*["']?([^"'\r\n]+)["']?/m);
        if (match && match[1]) {
          mongoUri = match[1].trim();
          process.env.MONGODB_URI = mongoUri;
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  if (!mongoUri) {
    console.log(
      "❌ [DATABASE] NOT CONNECTED: MONGODB_URI environment variable is missing in .env.local"
    );
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (
    mongoUri.includes("<username>") ||
    mongoUri.includes("<password>") ||
    mongoUri.includes("<cluster>")
  ) {
    console.log(
      "❌ [DATABASE] NOT CONNECTED: .env.local contains unconfigured template placeholders (<username>/<password>/<cluster>). Update .env.local with your real MongoDB Atlas connection string."
    );
    throw new Error(
      "MONGODB_URI in .env.local contains unconfigured placeholder tokens (<username>/<password>/<cluster>). Please update .env.local with your real MongoDB Atlas connection string."
    );
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    console.log("🔄 [DATABASE] Connecting to MongoDB Atlas...");

    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log("✅ [DATABASE] SUCCESS: Connected to MongoDB Atlas database!");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.error("❌ [DATABASE ERROR] Connection failed:", e.message || e);
    throw e;
  }

  return cached.conn;
}
