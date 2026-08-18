import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { SystemSetting, ProposalModel } from "@/lib/db/models";

// GET /api/activity-availability
// Public read-only endpoint returning the live activity availability state & timelines from MongoDB.
// Dynamic server-side calculation for General Quiz & Placement Questions based on startAt/endAt.
export async function GET() {
  try {
    await dbConnect();

    // 1. Base availability settings from SystemSetting or defaults
    const setting = await SystemSetting.findOne({ key: "activityAvailability" });
    const availabilityMap: Record<string, string> = {
      "Placement Questions": "OPEN",
      "General Quiz": "OPEN",
      "Technical Games": "COMING SOON",
      ...(setting?.value || {}),
    };

    const timelines: Record<string, { startAt?: string | null; endAt?: string | null; title?: string }> = {};

    // 2. Fetch active approved proposals for General Quiz & Placement Questions from MongoDB
    const now = new Date();

    const [activeQuiz, activePlacement] = await Promise.all([
      ProposalModel.findOne({
        type: "GENERAL_QUIZ",
        status: "APPROVED",
        isActive: true,
      }).sort({ submittedAt: -1 }),
      ProposalModel.findOne({
        type: "PLACEMENT_QUESTIONS",
        status: "APPROVED",
        isActive: true,
      }).sort({ submittedAt: -1 }),
    ]);

    // Calculate General Quiz dynamic availability from timeline
    if (activeQuiz && activeQuiz.startAt && activeQuiz.endAt) {
      const quizStart = new Date(activeQuiz.startAt);
      const quizEnd = new Date(activeQuiz.endAt);

      timelines["General Quiz"] = {
        startAt: quizStart.toISOString(),
        endAt: quizEnd.toISOString(),
        title: activeQuiz.title,
      };

      if (now < quizStart) {
        availabilityMap["General Quiz"] = "UPCOMING";
      } else if (now <= quizEnd) {
        availabilityMap["General Quiz"] = "OPEN";
      } else {
        availabilityMap["General Quiz"] = "CLOSED";
      }
    }

    // Calculate Placement Questions dynamic availability from timeline
    if (activePlacement && activePlacement.startAt && activePlacement.endAt) {
      const placementStart = new Date(activePlacement.startAt);
      const placementEnd = new Date(activePlacement.endAt);

      timelines["Placement Questions"] = {
        startAt: placementStart.toISOString(),
        endAt: placementEnd.toISOString(),
        title: activePlacement.title,
      };

      if (now < placementStart) {
        availabilityMap["Placement Questions"] = "UPCOMING";
      } else if (now <= placementEnd) {
        availabilityMap["Placement Questions"] = "OPEN";
      } else {
        availabilityMap["Placement Questions"] = "CLOSED";
      }
    }

    return NextResponse.json({
      activityAvailability: availabilityMap,
      timelines,
    });
  } catch (error: any) {
    console.error("❌ [API GET /activity-availability] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch activity availability.", error: error.message },
      { status: 500 }
    );
  }
}
