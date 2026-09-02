import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { ProposalModel, AuditLog, TestAttempt, TestAnswer, SecurityEvent } from "@/lib/db/models";
import { ACTIVE_PLACEMENT_SET, ACTIVE_QUIZ_SET } from "@/lib/studentState";
import mongoose from "mongoose";

function mapTypeToDb(type: string): string {
  if (type === "General Quiz") return "GENERAL_QUIZ";
  if (type === "Placement Questions") return "PLACEMENT_QUESTIONS";
  if (type === "Feed Community") return "FEED";
  if (type === "Technical Games") return "TECHNICAL_GAMES";
  return type;
}

function mapDbToHuman(type: string): string {
  if (type === "GENERAL_QUIZ") return "General Quiz";
  if (type === "PLACEMENT_QUESTIONS") return "Placement Questions";
  if (type === "FEED") return "Feed Community";
  if (type === "TECHNICAL_GAMES") return "Technical Games";
  return type;
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "Placement Questions";
    const dbType = mapTypeToDb(type);

    let activeProposal = await ProposalModel.findOne({
      type: dbType,
      status: "APPROVED",
      isActive: true,
    }).sort({ submittedAt: -1 });

    if (!activeProposal) {
      activeProposal = await ProposalModel.findOne({
        type: dbType,
        status: { $ne: "ARCHIVED" },
      }).sort({ submittedAt: -1 });
    }

    if (activeProposal) {
      return NextResponse.json({
        exists: true,
        proposal: {
          id: String(activeProposal._id),
          type: mapDbToHuman(activeProposal.type),
          title: activeProposal.title,
          submittedBy: activeProposal.submittedBy,
          authorDepartment: activeProposal.authorDepartment,
          status: activeProposal.status,
          isActive: activeProposal.isActive,
          questionsToUpload: activeProposal.questionsToUpload || (activeProposal.questions?.length || 0),
          questionsToDisplay: activeProposal.questionsToDisplay || (activeProposal.questions?.length || 0),
          randomQuestions: activeProposal.randomQuestions ?? true,
          randomChoices: activeProposal.randomChoices ?? false,
          timerMinutes: activeProposal.timerMinutes || (type === "Placement Questions" ? 30 : 15),
          questionsDetected: activeProposal.questionsDetected || (activeProposal.questions?.length || 0),
          csvFileName: activeProposal.csvFileName || "",
          startAt: activeProposal.startAt ? new Date(activeProposal.startAt).toISOString() : null,
          endAt: activeProposal.endAt ? new Date(activeProposal.endAt).toISOString() : null,
          questions: Array.isArray(activeProposal.questions) ? activeProposal.questions : [],
          revisionNumber: activeProposal.revisionNumber || 0,
        },
      });
    }

    const fallbackQuestions = type === "Placement Questions"
      ? ACTIVE_PLACEMENT_SET.questions
      : ACTIVE_QUIZ_SET.questions;

    const fallbackTitle = type === "Placement Questions"
      ? ACTIVE_PLACEMENT_SET.title
      : ACTIVE_QUIZ_SET.title;

    const fallbackDuration = type === "Placement Questions"
      ? ACTIVE_PLACEMENT_SET.timerMinutes
      : ACTIVE_QUIZ_SET.timerMinutes;

    return NextResponse.json({
      exists: false,
      proposal: {
        id: null,
        type,
        title: fallbackTitle,
        submittedBy: "Office Bearer",
        authorDepartment: "Computer Science & Engineering",
        status: "DRAFT",
        isActive: true,
        questionsToUpload: fallbackQuestions.length,
        questionsToDisplay: fallbackQuestions.length,
        randomQuestions: true,
        randomChoices: false,
        timerMinutes: fallbackDuration,
        questionsDetected: fallbackQuestions.length,
        csvFileName: "",
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        questions: fallbackQuestions,
        revisionNumber: 0,
      },
    });
  } catch (error: any) {
    console.error("❌ [API GET /api/office-bearer/activities/manage] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch activity configuration.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      type,
      title,
      submittedBy,
      authorDepartment,
      questions,
      questionsToUpload,
      questionsToDisplay,
      randomQuestions,
      randomChoices,
      timerMinutes,
      questionsDetected,
      csvFileName,
      startAt,
      endAt,
      publishImmediately = false,
    } = body;

    if (!type) {
      return NextResponse.json(
        { message: "Activity type is required." },
        { status: 400 }
      );
    }

    const dbType = mapTypeToDb(type);
    const parsedQuestions = Array.isArray(questions) ? questions : [];

    const totalCount = parsedQuestions.length;
    const uploadCount = Number(questionsToUpload) || totalCount || 1;
    let displayCount = Number(questionsToDisplay) || totalCount || 1;
    if (displayCount > totalCount && totalCount > 0) {
      displayCount = totalCount;
    }

    let parsedStartAt: Date | null = null;
    let parsedEndAt: Date | null = null;
    if (startAt) parsedStartAt = new Date(startAt);
    if (endAt) parsedEndAt = new Date(endAt);

    if (parsedStartAt && parsedEndAt && parsedEndAt.getTime() <= parsedStartAt.getTime()) {
      return NextResponse.json(
        { message: "Ending date and time must be strictly after starting date and time." },
        { status: 400 }
      );
    }

    const finalTitle = title || (type + " Assessment");
    const finalSubmittedBy = submittedBy || "Office Bearer";

    if (publishImmediately) {
      await ProposalModel.updateMany(
        { type: dbType, status: "APPROVED", isActive: true },
        {
          $set: {
            status: "ARCHIVED",
            isActive: false,
            archivedAt: new Date(),
          },
        }
      );

      // Clean old test attempts/scores for this activity type so reports start fresh for the newly published questions!
      try {
        const oldAttempts = await TestAttempt.find({
          activityType: dbType,
        }).select("_id");

        const oldAttemptIds = oldAttempts.map((a: any) => a._id);
        if (oldAttemptIds.length > 0) {
          await Promise.all([
            TestAttempt.deleteMany({ _id: { $in: oldAttemptIds } }),
            TestAnswer.deleteMany({ attemptId: { $in: oldAttemptIds } }),
            SecurityEvent.deleteMany({ attemptId: { $in: oldAttemptIds } }),
          ]);
          console.log(`🧹 [CLEANUP] Deleted ${oldAttemptIds.length} old ${dbType} test reports upon publishing new assessment.`);
        }
      } catch (cleanErr) {
        console.warn("Could not clean old test reports:", cleanErr);
      }
    }

    const newProposal = await ProposalModel.create({
      type: dbType,
      title: finalTitle,
      referenceId: new mongoose.Types.ObjectId(),
      submittedBy: finalSubmittedBy,
      authorDepartment: authorDepartment || "Computer Science & Engineering",
      status: publishImmediately ? "APPROVED" : "PENDING",
      isActive: publishImmediately ? true : false,
      submittedAt: new Date(),
      reviewedAt: publishImmediately ? new Date() : null,
      questionsToUpload: uploadCount,
      questionsToDisplay: displayCount,
      randomQuestions: randomQuestions !== undefined ? Boolean(randomQuestions) : true,
      randomChoices: randomChoices !== undefined ? Boolean(randomChoices) : false,
      timerMinutes: Number(timerMinutes) || (type === "Placement Questions" ? 30 : 15),
      questionsDetected: totalCount,
      csvFileName: csvFileName || "",
      details: finalTitle + " - " + displayCount + " questions to display out of " + totalCount + " configured.",
      questions: parsedQuestions,
      startAt: parsedStartAt,
      endAt: parsedEndAt,
    });

    await AuditLog.create({
      actorType: "OFFICE_BEARER",
      actorName: finalSubmittedBy,
      role: "Office Bearer",
      action: publishImmediately ? "PROPOSAL_APPROVED" : "PROPOSAL_SUBMITTED",
      module: "Activity Management",
      targetId: newProposal._id,
      targetType: dbType,
      originalValue: null,
      modifiedValue: {
        id: String(newProposal._id),
        title: finalTitle,
        totalQuestions: totalCount,
        questionsToDisplay: displayCount,
        timerMinutes: newProposal.timerMinutes,
      },
      metadata: {
        activityType: type,
        publishedImmediately: publishImmediately,
        csvFileName,
      },
    });

    console.log("✅ [MONGODB ATLAS] " + type + " persistently updated by " + finalSubmittedBy);

    return NextResponse.json({
      success: true,
      message: type + " configuration and questions saved to database successfully.",
      proposal: {
        id: String(newProposal._id),
        type: mapDbToHuman(newProposal.type),
        title: newProposal.title,
        questionsToUpload: newProposal.questionsToUpload,
        questionsToDisplay: newProposal.questionsToDisplay,
        randomQuestions: newProposal.randomQuestions,
        randomChoices: newProposal.randomChoices,
        timerMinutes: newProposal.timerMinutes,
        questionsDetected: totalCount,
        csvFileName: newProposal.csvFileName,
        startAt: newProposal.startAt,
        endAt: newProposal.endAt,
        questions: newProposal.questions,
        status: newProposal.status,
      },
    });
  } catch (error: any) {
    console.error("❌ [API POST /api/office-bearer/activities/manage] Error:", error);
    return NextResponse.json(
      { message: "Failed to save activity configuration.", error: error.message },
      { status: 500 }
    );
  }
}