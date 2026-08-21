import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { ProposalModel } from "@/lib/db/models";
import { ACTIVE_PLACEMENT_SET, HistorySet, TestQuestion } from "@/lib/studentState";

// GET /api/students-corner/history-questions
// Queries approved/archived Placement Questions from MongoDB Atlas.
// Computes 1-month expiry lifecycle (publishedAt + 30 days = expiresAt) dynamically.
export async function GET() {
  try {
    await dbConnect();

    const proposals = await ProposalModel.find({
      type: "PLACEMENT_QUESTIONS",
      status: { $in: ["APPROVED", "ARCHIVED"] },
    }).sort({ createdAt: -1 });

    const now = new Date();
    let bannerNotice: string | null = null;
    let activeExpiresAt: string | null = null;

    // Filter proposals:
    // 1. Must be ARCHIVED or have concluded its scheduled test timeline (endAt <= now)
    // 2. Must contain real uploaded questions
    const eligibleProposals = proposals.filter((p: any) => {
      // Must be archived or test timeline completed
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
      const publishedDateObj = p.reviewedAt || p.submittedAt || p.createdAt || now;
      const publishedDateStr = new Date(publishedDateObj).toISOString().split("T")[0];

      // Expiry lifecycle: 1 month (30 days) from publication
      const expiryDateObj = p.expiresAt || new Date(new Date(publishedDateObj).getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiryDateStr = new Date(expiryDateObj).toISOString().split("T")[0];

      const isExpired = now.getTime() > new Date(expiryDateObj).getTime();

      if (!isExpired && !activeExpiresAt) {
        activeExpiresAt = expiryDateStr;
        bannerNotice = `📌 Notice: Placement history questions remain active for 1 month from publication. Current question set active until: ${expiryDateStr}.`;
      }

      // Extract real questions
      let parsedQuestions: TestQuestion[] = [];
      if (Array.isArray(p.questions) && p.questions.length > 0) {
        parsedQuestions = p.questions;
      } else if (p.details) {
        try {
          const parsed = JSON.parse(p.details);
          if (Array.isArray(parsed)) {
            parsedQuestions = parsed;
          } else if (Array.isArray(parsed.questions)) {
            parsedQuestions = parsed.questions;
          }
        } catch {}
      }

      return {
        id: String(p._id),
        weekName: p.title || `Placement Questions — Set #${eligibleProposals.length - idx}`,
        title: p.title || "Placement Preparation & Technical Assessment",
        completedDate: publishedDateStr,
        questionCount: parsedQuestions.length,
        topic: "Technical & Placement Aptitude",
        questions: parsedQuestions,
        // Lifecycle metadata
        expiresAt: expiryDateStr,
        isExpired: isExpired || p.status === "ARCHIVED",
        status: p.status === "ARCHIVED" || isExpired ? "ARCHIVED" : "ACTIVE",
      } as any;
    });

    if (historySets.length > 0 && !bannerNotice) {
      bannerNotice = "⚠️ Notice: The current set of placement history questions has concluded its 1-month active period and is archived for revision.";
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
