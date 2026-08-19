import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { SystemSetting, ProposalModel, TestAttempt } from "@/lib/db/models";
import { ACTIVE_PLACEMENT_SET, ACTIVE_QUIZ_SET, StudentInfo, StudentResultReport } from "@/lib/studentState";
import mongoose from "mongoose";

// POST /api/students-corner/submit-test
// Body: { testType: "Placement Questions" | "General Quiz", studentInfo: StudentInfo, userAnswers: Record<string, string>, startedAt?: string }
// Enforces MongoDB timeline, one-attempt constraint per email+activity, server-side score calculation, and persists immutable question snapshot.
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { testType, userAnswers, startedAt } = body;

    // Handle studentInfo with legacy fallback
    const rawStudentInfo = body.studentInfo || {
      name: body.username,
      email: body.email,
      department: body.department || "General",
      year: body.year || "1",
      section: body.section || "A",
      rollNumber: body.rollNumber || "N/A",
    };

    const studentInfo: StudentInfo = {
      name: (rawStudentInfo.name || "").trim(),
      email: (rawStudentInfo.email || "").trim(),
      department: (rawStudentInfo.department || "").trim(),
      year: (rawStudentInfo.year || "").trim(),
      section: (rawStudentInfo.section || "").trim(),
      rollNumber: (rawStudentInfo.rollNumber || "").trim(),
    };

    // 1. Validate required student fields
    if (
      !testType ||
      !studentInfo.name ||
      !studentInfo.email ||
      !studentInfo.department ||
      !studentInfo.year ||
      !studentInfo.section ||
      !studentInfo.rollNumber
    ) {
      return NextResponse.json(
        { message: "All student information fields (Name, Department, Year, Section, Email, Roll Number) and testType are required." },
        { status: 400 }
      );
    }

    // Email format validation & normalization
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentInfo.email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }
    const studentEmailNormalized = studentInfo.email.toLowerCase();

    const now = new Date();

    // 2. Mandatory MongoDB Timeline & Active Proposal Check
    const dbType = testType === "Placement Questions" ? "PLACEMENT_QUESTIONS" : "GENERAL_QUIZ";
    const activeProposal = await ProposalModel.findOne({
      type: dbType,
      status: "APPROVED",
      isActive: true,
    }).sort({ submittedAt: -1 });

    if (!activeProposal) {
      return NextResponse.json(
        {
          allowed: false,
          status: "CLOSED",
          message: `Assessment submission rejected: "${testType}" is not currently published.`,
        },
        { status: 403 }
      );
    }

    // Logical root activity ID across revisions
    const logicalActivityId = activeProposal.parentId || activeProposal._id;

    if (activeProposal.startAt && activeProposal.endAt) {
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

    // Base SystemSetting fallback availability check
    const setting = await SystemSetting.findOne({ key: "activityAvailability" });
    const availabilityMap: Record<string, string> = setting?.value || {
      "Placement Questions": "OPEN",
      "General Quiz": "OPEN",
      "Technical Games": "COMING SOON",
    };

    const currentStatus = availabilityMap[testType] || "OPEN";
    if (currentStatus !== "OPEN") {
      return NextResponse.json(
        {
          allowed: false,
          status: currentStatus,
          message: `Assessment submission rejected: "${testType}" is ${currentStatus.toLowerCase()}.`,
        },
        { status: 403 }
      );
    }

    // 3. Duplicate Attempt Check (Level 2: Backend Check)
    const existingAttempt = await TestAttempt.findOne({
      studentEmailNormalized,
      activityId: logicalActivityId,
      status: { $in: ["COMPLETED", "SUBMITTED"] },
    });

    if (existingAttempt) {
      return NextResponse.json(
        {
          allowed: false,
          code: "ALREADY_ATTEMPTED",
          message: "You have already attempted this activity.",
        },
        { status: 409 }
      );
    }

    // 4. Server-Side Score Calculation & Immutable Question Snapshot Construction
    const questionList = testType === "Placement Questions" ? ACTIVE_PLACEMENT_SET.questions : ACTIVE_QUIZ_SET.questions;
    const testTitle = testType === "Placement Questions" ? ACTIVE_PLACEMENT_SET.title : ACTIVE_QUIZ_SET.title;

    let correctCount = 0;
    const answersMap = userAnswers || {};

    const questionSnapshot = questionList.map((q) => {
      const selected = answersMap[q.id] || "No Answer Selected";
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        question: q.question,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = questionList.length;
    const score = testType === "Placement Questions"
      ? correctCount * 25
      : Math.round((correctCount / totalQuestions) * 100);
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const wrongCount = totalQuestions - correctCount;

    const startedAtDate = startedAt ? new Date(startedAt) : new Date();

    // 5. Persist Attempt to MongoDB (Level 3: MongoDB Unique Index Enforced)
    let createdAttemptId = `attempt-${Date.now()}`;
    try {
      const newAttempt = await TestAttempt.create({
        studentName: studentInfo.name,
        studentEmail: studentInfo.email,
        studentEmailNormalized,
        department: studentInfo.department,
        year: studentInfo.year,
        section: studentInfo.section,
        rollNumber: studentInfo.rollNumber,
        activityId: logicalActivityId,
        activityType: dbType,
        activityVersion: activeProposal.revisionNumber || 0,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        percentage,
        questionSnapshot,
        submittedAnswers: answersMap,
        startedAt: startedAtDate,
        submittedAt: now,
        status: "COMPLETED",
        // Legacy fields for backward-compatibility
        testType: dbType,
        testId: logicalActivityId,
        participant: {
          username: studentInfo.name,
          email: studentInfo.email,
        },
        emailVerified: true,
      });

      createdAttemptId = newAttempt._id.toString();
    } catch (dbErr: any) {
      if (dbErr.code === 11000) {
        // Compound index violation (studentEmailNormalized + activityId)
        console.warn(`⛔ [DUPLICATE ATTEMPT BLOCKED BY MONGODB UNIQUE INDEX] ${studentEmailNormalized} for activity ${logicalActivityId}`);
        return NextResponse.json(
          {
            allowed: false,
            code: "ALREADY_ATTEMPTED",
            message: "You have already attempted this activity.",
          },
          { status: 409 }
        );
      }
      console.error("❌ Failed to write TestAttempt doc to MongoDB:", dbErr);
      return NextResponse.json(
        { message: "Could not securely record test attempt in database.", error: dbErr.message },
        { status: 500 }
      );
    }

    // 6. Build Detailed Immediate Result Report
    const report: StudentResultReport = {
      attemptId: createdAttemptId,
      username: studentInfo.name,
      email: studentInfo.email,
      studentInfo,
      department: studentInfo.department,
      year: studentInfo.year,
      section: studentInfo.section,
      rollNumber: studentInfo.rollNumber,
      testType,
      testTitle,
      score,
      totalQuestions,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: wrongCount,
      percentage,
      timestamp: now.toISOString().replace("T", " ").substring(0, 19),
      details: questionSnapshot.map((item) => ({
        questionId: item.questionId,
        questionText: item.question,
        userAnswer: item.selectedAnswer,
        correctAnswer: item.correctAnswer,
        isCorrect: item.isCorrect,
        explanation: item.explanation,
      })),
    };

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
