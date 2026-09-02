import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { SystemSetting, ProposalModel, TestAttempt, AuditLog } from "@/lib/db/models";
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

    // Email format & domain validation & normalization (@mepcoeng.ac.in)
    const studentEmailNormalized = studentInfo.email.trim().toLowerCase();
    const collegeDomain = "@mepcoeng.ac.in";
    const emailParts = studentEmailNormalized.split("@");
    if (emailParts.length !== 2 || !emailParts[0] || `@${emailParts[1]}` !== collegeDomain) {
      return NextResponse.json(
        { message: "Please use your Mepco college email address ending with @mepcoeng.ac.in." },
        { status: 400 }
      );
    }

    const now = new Date();

    // 2. Mandatory MongoDB Timeline & Active Proposal Check
    const dbType = testType === "Placement Questions" ? "PLACEMENT_QUESTIONS" : "GENERAL_QUIZ";
    const activeProposal = await ProposalModel.findOne({
      type: dbType,
      status: "APPROVED",
      isActive: true,
    }).sort({ submittedAt: -1 });

    const logicalActivityId = activeProposal
      ? String(activeProposal.parentId || activeProposal._id)
      : (testType === "Placement Questions" ? "default-placement" : "default-general-quiz");

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
            status: "EXPIRED",
            isExpired: true,
            message: `Assessment submission rejected: "${testType}" has expired. Submissions are closed.`,
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
    if (currentStatus === "CLOSED") {
      return NextResponse.json(
        {
          allowed: false,
          status: "CLOSED",
          isExpired: true,
          message: `Assessment submission rejected: "${testType}" is currently closed or expired.`,
        },
        { status: 403 }
      );
    }
    if (currentStatus === "COMING SOON" || currentStatus === "UPCOMING") {
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
          message: "You have already attempted this activity. Only one attempt is allowed per student.",
        },
        { status: 409 }
      );
    }

    // 4. Server-Side Score Calculation & Immutable Question Snapshot Construction
    let questionList = testType === "Placement Questions" ? ACTIVE_PLACEMENT_SET.questions : ACTIVE_QUIZ_SET.questions;
    let testTitle = testType === "Placement Questions" ? ACTIVE_PLACEMENT_SET.title : ACTIVE_QUIZ_SET.title;

    if (activeProposal) {
      if (activeProposal.title) testTitle = activeProposal.title;
      if (Array.isArray(activeProposal.questions) && activeProposal.questions.length > 0) {
        questionList = activeProposal.questions;
      } else if (activeProposal.details) {
        try {
          const parsed = JSON.parse(activeProposal.details);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].correctAnswer) {
            questionList = parsed;
          }
        } catch {
          // keep fallback questionList
        }
      }
    }

    let correctCount = 0;
    const answersMap = userAnswers || {};
    const answeredKeys = Object.keys(answersMap);

    // If the student was served a subset of questions (e.g. questionsToDisplay), evaluate against the served questions
    let evaluatedQuestions = questionList;
    if (answeredKeys.length > 0) {
      const matching = questionList.filter((q) => answeredKeys.includes(String(q.id)));
      if (matching.length > 0) {
        evaluatedQuestions = matching;
      }
    }

    const questionSnapshot = evaluatedQuestions.map((q) => {
      const selected = answersMap[q.id] || "No Answer Selected";
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        question: q.question,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || "",
      };
    });

    const totalQuestions = evaluatedQuestions.length > 0 ? evaluatedQuestions.length : 1;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const score = percentage;
    const wrongCount = Math.max(0, totalQuestions - correctCount);

    const startedAtDate = startedAt ? new Date(startedAt) : new Date();

    // 5. Persist Attempt to MongoDB: replace any previous report by this student so latest report is stored
    try {
      await TestAttempt.deleteMany({
        studentEmailNormalized,
        activityId: logicalActivityId,
      });
    } catch (cleanErr) {
      console.warn("Could not remove previous attempt:", cleanErr);
    }

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
        activityVersion: activeProposal?.revisionNumber || 0,
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

    // 7. Record Audit Log Entry for test submission
    try {
      await AuditLog.create({
        actorType: "STUDENT",
        actorName: studentInfo.name,
        actorEmail: studentEmailNormalized,
        role: "Student",
        action: "STUDENT_TEST_SUBMITTED",
        module: testType,
        targetId: createdAttemptId && mongoose.Types.ObjectId.isValid(createdAttemptId) ? new mongoose.Types.ObjectId(createdAttemptId) : null,
        targetType: "TEST_ATTEMPT",
        originalValue: null,
        modifiedValue: {
          score,
          percentage,
          totalQuestions,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          department: studentInfo.department,
          rollNumber: studentInfo.rollNumber,
        },
        metadata: {
          studentName: studentInfo.name,
          studentEmail: studentEmailNormalized,
          testType,
          score,
          percentage,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation warning in submit-test:", auditErr);
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
