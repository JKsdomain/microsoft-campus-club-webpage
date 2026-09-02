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

    const timelines: Record<
      string,
      {
        startAt?: string | null;
        endAt?: string | null;
        title?: string;
        timerMinutes?: number;
        questionsToDisplay?: number;
        totalQuestions?: number;
      }
    > = {};

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
        timerMinutes: activeQuiz.timerMinutes || 15,
        questionsToDisplay: activeQuiz.questionsToDisplay || (activeQuiz.questions?.length || 3),
        totalQuestions: activeQuiz.questions?.length || activeQuiz.questionsToUpload || 3,
      };

      if (now < quizStart) {
        availabilityMap["General Quiz"] = "UPCOMING";
      } else if (now <= quizEnd) {
        availabilityMap["General Quiz"] = "OPEN";
      } else {
        availabilityMap["General Quiz"] = "CLOSED";
      }
    } else if (!activeQuiz) {
      const latestQuiz = await ProposalModel.findOne({
        type: "GENERAL_QUIZ",
        status: { $in: ["APPROVED", "ARCHIVED"] },
      }).sort({ submittedAt: -1 });

      if (latestQuiz && latestQuiz.endAt) {
        const quizEnd = new Date(latestQuiz.endAt);
        if (now > quizEnd) {
          timelines["General Quiz"] = {
            startAt: latestQuiz.startAt ? new Date(latestQuiz.startAt).toISOString() : null,
            endAt: quizEnd.toISOString(),
            title: latestQuiz.title,
            timerMinutes: latestQuiz.timerMinutes || 15,
            questionsToDisplay: latestQuiz.questionsToDisplay || (latestQuiz.questions?.length || 3),
            totalQuestions: latestQuiz.questions?.length || latestQuiz.questionsToUpload || 3,
          };
          availabilityMap["General Quiz"] = "CLOSED";
        }
      }
    } else if (activeQuiz) {
      timelines["General Quiz"] = {
        startAt: activeQuiz.startAt ? new Date(activeQuiz.startAt).toISOString() : null,
        endAt: activeQuiz.endAt ? new Date(activeQuiz.endAt).toISOString() : null,
        title: activeQuiz.title,
        timerMinutes: activeQuiz.timerMinutes || 15,
        questionsToDisplay: activeQuiz.questionsToDisplay || (activeQuiz.questions?.length || 3),
        totalQuestions: activeQuiz.questions?.length || activeQuiz.questionsToUpload || 3,
      };
    }

    // Calculate Placement Questions dynamic availability from timeline
    if (activePlacement && activePlacement.startAt && activePlacement.endAt) {
      const placementStart = new Date(activePlacement.startAt);
      const placementEnd = new Date(activePlacement.endAt);

      timelines["Placement Questions"] = {
        startAt: placementStart.toISOString(),
        endAt: placementEnd.toISOString(),
        title: activePlacement.title,
        timerMinutes: activePlacement.timerMinutes || 30,
        questionsToDisplay: activePlacement.questionsToDisplay || (activePlacement.questions?.length || 4),
        totalQuestions: activePlacement.questions?.length || activePlacement.questionsToUpload || 4,
      };

      if (now < placementStart) {
        availabilityMap["Placement Questions"] = "UPCOMING";
      } else if (now <= placementEnd) {
        availabilityMap["Placement Questions"] = "OPEN";
      } else {
        availabilityMap["Placement Questions"] = "CLOSED";
      }
    } else if (!activePlacement) {
      const latestPlacement = await ProposalModel.findOne({
        type: "PLACEMENT_QUESTIONS",
        status: { $in: ["APPROVED", "ARCHIVED"] },
      }).sort({ submittedAt: -1 });

      if (latestPlacement && latestPlacement.endAt) {
        const placementEnd = new Date(latestPlacement.endAt);
        if (now > placementEnd) {
          timelines["Placement Questions"] = {
            startAt: latestPlacement.startAt ? new Date(latestPlacement.startAt).toISOString() : null,
            endAt: placementEnd.toISOString(),
            title: latestPlacement.title,
            timerMinutes: latestPlacement.timerMinutes || 30,
            questionsToDisplay: latestPlacement.questionsToDisplay || (latestPlacement.questions?.length || 4),
            totalQuestions: latestPlacement.questions?.length || latestPlacement.questionsToUpload || 4,
          };
          availabilityMap["Placement Questions"] = "CLOSED";
        }
      }
    } else if (activePlacement) {
      timelines["Placement Questions"] = {
        startAt: activePlacement.startAt ? new Date(activePlacement.startAt).toISOString() : null,
        endAt: activePlacement.endAt ? new Date(activePlacement.endAt).toISOString() : null,
        title: activePlacement.title,
        timerMinutes: activePlacement.timerMinutes || 30,
        questionsToDisplay: activePlacement.questionsToDisplay || (activePlacement.questions?.length || 4),
        totalQuestions: activePlacement.questions?.length || activePlacement.questionsToUpload || 4,
      };
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
