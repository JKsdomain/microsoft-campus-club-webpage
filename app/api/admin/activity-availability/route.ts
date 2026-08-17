import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { SystemSetting, AuditLog } from "@/lib/db/models";

// GET /api/admin/activity-availability
// Returns the current activity availability map from SystemSetting
export async function GET() {
  try {
    await dbConnect();

    const setting = await SystemSetting.findOne({ key: "activityAvailability" });

    if (setting && setting.value) {
      return NextResponse.json({ activityAvailability: setting.value });
    }

    // Return defaults if no setting exists yet
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

// PUT /api/admin/activity-availability
// Body: { activityAvailability: { "Placement Questions": "OPEN", ... } }
// Upserts the entire availability map into SystemSetting
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { activityAvailability } = body;

    if (!activityAvailability || typeof activityAvailability !== "object") {
      return NextResponse.json(
        { message: "activityAvailability map is required." },
        { status: 400 }
      );
    }

    // Upsert: create if missing, update if exists
    const result = await SystemSetting.findOneAndUpdate(
      { key: "activityAvailability" },
      {
        $set: {
          value: activityAvailability,
          description: "Activity availability status for Students Corner modules.",
        },
      },
      { upsert: true, new: true }
    );

    // Write audit log
    await AuditLog.create({
      actorType: "ADMIN",
      action: `Updated activity availability: ${JSON.stringify(activityAvailability)}`,
      module: "Responsibilities",
      metadata: { activityAvailability },
    });

    console.log("✅ [MONGODB ATLAS] Activity availability updated:", activityAvailability);

    return NextResponse.json({
      message: "Activity availability updated in MongoDB.",
      activityAvailability: result.value,
    });
  } catch (error: any) {
    console.error("❌ [API PUT /activity-availability] Error:", error);
    return NextResponse.json(
      { message: "Failed to update activity availability.", error: error.message },
      { status: 500 }
    );
  }
}
