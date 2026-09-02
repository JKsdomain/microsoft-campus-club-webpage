import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { ProposalModel } from "@/lib/db/models";
import { ACTIVE_PLACEMENT_SET, HistorySet, TestQuestion } from "@/lib/studentState";

// Helper: Normalize raw question objects into standard TestQuestion schema
function normalizeQuestions(rawList: any[]): TestQuestion[] {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item: any, idx: number) => {
    let questionText = item.question || item.questionText || item.text || `Question ${idx + 1}`;
    
    let optionsList: string[] = [];
    if (Array.isArray(item.options) && item.options.length > 0) {
      optionsList = item.options.map((opt: any) => (typeof opt === "string" ? opt : opt.text || String(opt)));
    } else if (Array.isArray(item.choices) && item.choices.length > 0) {
      optionsList = item.choices.map((c: any) => (typeof c === "string" ? c : c.text || String(c)));
    } else {
      optionsList = ["Option A", "Option B", "Option C", "Option D"];
    }

    let correctAnswer = item.correctAnswer || item.answer || item.correct;
    if (!correctAnswer || !optionsList.includes(correctAnswer)) {
      correctAnswer = optionsList[0] || "Option A";
    }

    let explanation = item.explanation || item.exp || "Explanation provided for review and learning reference.";

    return {
      id: String(item.id || item._id || idx + 1),
      question: questionText,
      options: optionsList,
      correctAnswer,
      explanation,
    };
  });
}

// GET /api/students-corner/history-questions
// Queries approved/archived Placement Questions & General Quizzes from MongoDB Atlas.
// Automatically purges expired history questions older than 30 days (1 month).
export async function GET() {
  try {
    await dbConnect();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Automatic 30-Day Auto Purge: Delete archived proposals older than 30 days
    try {
      const purgeResult = await ProposalModel.deleteMany({
        type: { $in: ["PLACEMENT_QUESTIONS", "GENERAL_QUIZ"] },
        status: "ARCHIVED",
        updatedAt: { $lt: thirtyDaysAgo },
      });
      if (purgeResult.deletedCount > 0) {
        console.log(`🧹 [AUTO-PURGE 30-DAY LIFECYCLE] Purged ${purgeResult.deletedCount} history question set(s) older than 30 days.`);
      }
    } catch (purgeErr) {
      console.warn("Could not execute 30-day auto purge on proposals:", purgeErr);
    }

    // 2. Query remaining active/archived proposals
    const proposals = await ProposalModel.find({
      type: { $in: ["PLACEMENT_QUESTIONS", "GENERAL_QUIZ"] },
      status: { $in: ["APPROVED", "ARCHIVED"] },
    }).sort({ createdAt: -1 });

    let bannerNotice: string | null = null;
    let activeExpiresAt: string | null = null;

    // Filter proposals:
    // 1. Must be ARCHIVED or completed past endAt
    // 2. Published within 30 days (publishedDateObj >= thirtyDaysAgo)
    // 3. Contain valid question entries
    const eligibleProposals = proposals.filter((p: any) => {
      const publishedDateObj = p.archivedAt || p.reviewedAt || p.submittedAt || p.createdAt || now;
      if (new Date(publishedDateObj).getTime() < thirtyDaysAgo.getTime()) {
        return false;
      }

      const isArchived = p.status === "ARCHIVED";
      const isPastTimeline = p.endAt ? new Date(p.endAt).getTime() <= now.getTime() : isArchived;
      if (!isArchived && !isPastTimeline) {
        return false;
      }

      // Check if real questions exist
      if (Array.isArray(p.questions) && p.questions.length > 0) {
        return true;
      }
      if (p.details && (p.details.startsWith("[") || p.details.startsWith("{"))) {
        try {
          const parsed = JSON.parse(p.details);
          if (Array.isArray(parsed) && parsed.length > 0) return true;
          if (Array.isArray(parsed.questions) && parsed.questions.length > 0) return true;
        } catch {}
      }
      return false;
    });

    const historySets: HistorySet[] = eligibleProposals.map((p: any, idx: number) => {
      const publishedDateObj = p.archivedAt || p.reviewedAt || p.submittedAt || p.createdAt || now;
      const publishedDateStr = new Date(publishedDateObj).toISOString().split("T")[0];

      // Expiry lifecycle: 1 month (30 days) from publication
      const expiryDateObj = new Date(new Date(publishedDateObj).getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiryDateStr = expiryDateObj.toISOString().split("T")[0];

      const isExpired = now.getTime() > expiryDateObj.getTime();

      if (!isExpired && !activeExpiresAt) {
        activeExpiresAt = expiryDateStr;
        bannerNotice = `📌 Notice: History questions remain available for 1 month from publication. Current active set valid until: ${expiryDateStr}.`;
      }

      // Extract & normalize real database questions
      let rawQuestions: any[] = [];
      if (Array.isArray(p.questions) && p.questions.length > 0) {
        rawQuestions = p.questions;
      } else if (p.details) {
        try {
          const parsed = JSON.parse(p.details);
          if (Array.isArray(parsed)) {
            rawQuestions = parsed;
          } else if (Array.isArray(parsed.questions)) {
            rawQuestions = parsed.questions;
          }
        } catch {}
      }

      const parsedQuestions = normalizeQuestions(rawQuestions);

      const typeLabel = p.type === "GENERAL_QUIZ" ? "General Quiz" : "Placement Questions";

      return {
        id: String(p._id),
        weekName: p.title || `${typeLabel} — Set #${eligibleProposals.length - idx}`,
        title: p.title || `${typeLabel} Revision & Technical Assessment`,
        completedDate: publishedDateStr,
        questionCount: parsedQuestions.length,
        topic: typeLabel,
        questions: parsedQuestions,
        // Lifecycle metadata
        expiresAt: expiryDateStr,
        isExpired: isExpired || p.status === "ARCHIVED",
        status: p.status === "ARCHIVED" || isExpired ? "ARCHIVED" : "ACTIVE",
      } as any;
    });

    if (historySets.length > 0 && !bannerNotice) {
      bannerNotice = "⚠️ Notice: History questions are archived for 1 month of revision and automatically purged after 30 days.";
    }

    return NextResponse.json({
      historySets,
      bannerNotice,
      activeExpiresAt,
    });
  } catch (error: any) {
    console.error("❌ [API GET /history-questions] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch history questions from database.", error: error.message },
      { status: 500 }
    );
  }
}
