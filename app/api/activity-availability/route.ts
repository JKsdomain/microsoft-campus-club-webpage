import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { SystemSetting } from "@/lib/db/models";

// GET /api/activity-availability
// Public read-only endpoint returning the live activity availability state from MongoDB
export async function GET() {
  try {
    await dbConnect();

    const setting = await SystemSetting.findOne({ key: "activityAvailability" });

    if (setting && setting.value) {
      return NextResponse.json({ activityAvailability: setting.value });
    }

    // Default availability
    const defaults: Record<string, string> = {
      "Placement Questions": "OPEN",
      "General Quiz": "OPEN",
      "Technical Games": "COMING SOON",
    };

    return NextResponse.json({ activityAvailability: defaults });
  } catch (error: any) {
    console.error("❌ [API GET /activity-availability] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch activity availability.", error: error.message },
      { status: 500 }
    );
  }
}
