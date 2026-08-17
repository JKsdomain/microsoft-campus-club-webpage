import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { SystemSetting } from "@/lib/db/models";

// POST /api/students-corner/validate-event
// Body: { activityName: "Placement Questions" | "General Quiz" | "Technical Games" }
// Validates whether the event is currently OPEN in MongoDB before allowing access/test start
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { activityName } = body;

    if (!activityName) {
      return NextResponse.json({ message: "activityName is required." }, { status: 400 });
    }

    const setting = await SystemSetting.findOne({ key: "activityAvailability" });
    const availabilityMap: Record<string, string> = setting?.value || {
      "Placement Questions": "OPEN",
      "General Quiz": "OPEN",
      "Technical Games": "COMING SOON",
    };

    const currentStatus = availabilityMap[activityName] || "OPEN";

    if (currentStatus === "CLOSED") {
      return NextResponse.json(
        {
          allowed: false,
          status: "CLOSED",
          message: `"${activityName}" is currently closed by the administrator. Access is not permitted.`,
        },
        { status: 403 }
      );
    }

    if (currentStatus === "COMING SOON") {
      return NextResponse.json(
        {
          allowed: false,
          status: "COMING SOON",
          message: `"${activityName}" is coming soon and is not currently active.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ allowed: true, status: "OPEN" });
  } catch (error: any) {
    console.error("❌ [API /validate-event] Error:", error);
    return NextResponse.json(
      { message: "Failed to validate activity availability.", error: error.message },
      { status: 500 }
    );
  }
}
