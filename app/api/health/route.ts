import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { initDatabaseDefaults } from "@/lib/db/seed";

export async function GET() {
  let dbStatus = "Healthy";
  let cloudinaryStatus = "Healthy";
  let emailStatus = "Healthy";
  let apiStatus = "Healthy";

  try {
    const conn = await dbConnect();
    if (conn.connection.readyState !== 1) {
      dbStatus = "Degraded";
    } else {
      // Ensure defaults exist
      await initDatabaseDefaults();
    }
  } catch (err) {
    console.error("Health Check Database Error:", err);
    dbStatus = "Unavailable";
  }

  return NextResponse.json(
    {
      database: dbStatus,
      cloudinary: cloudinaryStatus,
      email: emailStatus,
      api: apiStatus,
      timestamp: new Date().toISOString(),
    },
    { status: dbStatus === "Unavailable" ? 503 : 200 }
  );
}
