import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { TestAttempt } from "@/lib/db/models";
import { generateQuizResultPDF, QuizResultPDFData } from "@/lib/pdfGenerator";
import mongoose from "mongoose";

// POST /api/students-corner/download-result-pdf
// Generates official MCC student test result transcript PDF from MongoDB immutable question snapshot.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { attemptId, email, report } = body;

    let resultData: QuizResultPDFData | null = null;

    // 1. If attemptId is provided, query the immutable MongoDB TestAttempt record
    if (attemptId && attemptId !== "simulated" && mongoose.Types.ObjectId.isValid(attemptId)) {
      try {
        await dbConnect();
        const attempt = await TestAttempt.findById(attemptId);
        if (attempt) {
          resultData = {
            studentName: attempt.studentName,
            studentEmail: attempt.studentEmail,
            department: attempt.department,
            year: attempt.year,
            section: attempt.section,
            rollNumber: attempt.rollNumber,
            testType: attempt.activityType === "GENERAL_QUIZ" ? "General Quiz" : "Placement Questions",
            testTitle: attempt.activityType === "GENERAL_QUIZ" ? "General Quiz Challenge" : "Placement Questions Test",
            score: attempt.score,
            totalQuestions: attempt.totalQuestions || (attempt.questionSnapshot ? attempt.questionSnapshot.length : 0),
            correctAnswersCount: attempt.correctAnswers ?? attempt.correctCount ?? (attempt.questionSnapshot ? attempt.questionSnapshot.filter((q: any) => q.isCorrect).length : 0),
            incorrectAnswersCount: attempt.wrongAnswers ?? attempt.wrongCount ?? (attempt.questionSnapshot ? attempt.questionSnapshot.filter((q: any) => !q.isCorrect).length : 0),
            percentage: attempt.percentage || attempt.score,
            timestamp: attempt.submittedAt || attempt.completedAt ? new Date(attempt.submittedAt || attempt.completedAt).toISOString().replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
            details: (attempt.questionSnapshot || []).map((item: any) => ({
              questionId: item.questionId,
              questionText: item.question,
              userAnswer: item.selectedAnswer,
              correctAnswer: item.correctAnswer,
              isCorrect: item.isCorrect,
              explanation: item.explanation,
            })),
          };
        }
      } catch (dbErr) {
        console.warn("Could not query DB TestAttempt for PDF, falling back to report payload:", dbErr);
      }
    }

    // 2. Fallback to client-passed report payload if DB attempt not found or in preview
    if (!resultData && report) {
      resultData = {
        studentName: report.username || report.studentInfo?.name || "Student",
        studentEmail: report.email || report.studentInfo?.email || "student@mepcoeng.ac.in",
        department: report.department || report.studentInfo?.department || "General",
        year: report.year || report.studentInfo?.year || "N/A",
        section: report.section || report.studentInfo?.section || "N/A",
        rollNumber: report.rollNumber || report.studentInfo?.rollNumber || "N/A",
        testType: report.testType || "Placement Questions",
        testTitle: report.testTitle || "Assessment",
        score: report.score ?? 0,
        totalQuestions: report.totalQuestions ?? (Array.isArray(report.details) ? report.details.length : 0),
        correctAnswersCount: report.correctAnswersCount ?? 0,
        incorrectAnswersCount: report.incorrectAnswersCount ?? 0,
        percentage: report.percentage ?? report.score ?? 0,
        timestamp: report.timestamp || new Date().toISOString().replace("T", " ").substring(0, 19),
        details: Array.isArray(report.details) ? report.details : [],
      };
    }

    if (!resultData) {
      return NextResponse.json(
        { message: "Attempt result data could not be located." },
        { status: 404 }
      );
    }

    const pdfBuffer = await generateQuizResultPDF(resultData);
    const safeStudent = (resultData.studentName || "result").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const safeType = (resultData.testType || "quiz").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const fileName = `mcc-${safeType}-result-${safeStudent}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error: any) {
    console.error("❌ [API /download-result-pdf] Error:", error);
    return NextResponse.json(
      { message: "Failed to generate test result PDF.", error: error.message },
      { status: 500 }
    );
  }
}
