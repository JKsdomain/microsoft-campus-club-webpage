import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { SystemSetting, ProposalModel, TestAttempt } from "@/lib/db/models";
import { evaluatePlacementSubmission, evaluateQuizSubmission } from "@/lib/studentState";
import mongoose from "mongoose";

// POST /api/students-corner/submit-test
// Body: { testType: "Placement Questions" | "General Quiz", username: string, email: string, userAnswers: Record<string, string> }
// Validates MongoDB activity timeline & availability BEFORE accepting and processing submission.
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { testType, username, email, userAnswers } = body;

    if (!testType || !username || !email) {
      return NextResponse.json(
        { message: "testType, username, and email are required." },
        { status: 400 }
      );
    }

    const now = new Date();

    // 1. Mandatory MongoDB Timeline Check for General Quiz & Placement Questions
    if (testType === "General Quiz" || testType === "Placement Questions") {
      const dbType = testType === "General Quiz" ? "GENERAL_QUIZ" : "PLACEMENT_QUESTIONS";
      const activeProposal = await ProposalModel.findOne({
        type: dbType,
        status: "APPROVED",
        isActive: true,
      }).sort({ submittedAt: -1 });

      if (activeProposal && activeProposal.startAt && activeProposal.endAt) {
        const startAt = new Date(activeProposal.startAt);
        const endAt = new Date(activeProposal.endAt);

        if (now < startAt) {
          console.warn(`⛔ [SUBMIT TEST REJECTED] ${testType} has not started yet (Start: ${startAt.toISOString()}).`);
          return NextResponse.json(
            {
              allowed: false,
              status: "UPCOMING",
              message: `Assessment submission rejected: "${testType}" has not started yet.`,
            },
            { status: 403 }
          );
        }

        if (now > endAt) {
          console.warn(`⛔ [SUBMIT TEST REJECTED] ${testType} has passed deadline (End: ${endAt.toISOString()}).`);
          return NextResponse.json(
            {
              allowed: false,
              status: "CLOSED",
              message: `Assessment submission rejected: "${testType}" has ended. Submissions are closed.`,
            },
            { status: 403 }
          );
        }
      }
    }

    // 2. Base SystemSetting fallback availability check
    const setting = await SystemSetting.findOne({ key: "activityAvailability" });
    const availabilityMap: Record<string, string> = setting?.value || {
      "Placement Questions": "OPEN",
      "General Quiz": "OPEN",
      "Technical Games": "COMING SOON",
    };

    const currentStatus = availabilityMap[testType] || "OPEN";

    if (currentStatus !== "OPEN") {
      console.warn(`⛔ [SUBMIT TEST REJECTED] ${testType} is ${currentStatus} in MongoDB.`);
      return NextResponse.json(
        {
          allowed: false,
          status: currentStatus,
          message: `Assessment submission rejected: "${testType}" has been ${currentStatus.toLowerCase()} by the administrator.`,
        },
        { status: 403 }
      );
    }

    // 3. Evaluate submission
    let report;
    if (testType === "Placement Questions") {
      report = evaluatePlacementSubmission(username, email, userAnswers || {});
    } else {
      report = evaluateQuizSubmission(username, email, userAnswers || {});
    }

    // 4. Persist attempt record to MongoDB if TestAttempt model is available
    try {
      if (TestAttempt) {
        await TestAttempt.create({
          testType: testType === "Placement Questions" ? "PLACEMENT_QUESTIONS" : "GENERAL_QUIZ",
          testId: new mongoose.Types.ObjectId(),
          participant: {
            username,
            email,
          },
          emailVerified: true,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          submittedAt: new Date(),
          status: "SUBMITTED",
          score: report.score,
          percentage: report.percentage,
          totalQuestions: report.totalQuestions,
          correctAnswers: report.correctAnswersCount,
          incorrectAnswers: report.incorrectAnswersCount,
        });
      }
    } catch (dbErr) {
      console.warn("⚠️ Could not write TestAttempt doc:", dbErr);
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("❌ [API /submit-test] Error:", error);
    return NextResponse.json(
      { message: "Failed to process test submission.", error: error.message },
      { status: 500 }
    );
  }
}
