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

    const historySets: HistorySet[] = proposals.map((p: any, idx: number) => {
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

      // Extract questions from proposal details
      let parsedQuestions: TestQuestion[] = [];
      try {
        if (p.details && (p.details.startsWith("[") || p.details.startsWith("{"))) {
          const parsed = JSON.parse(p.details);
          if (Array.isArray(parsed)) {
            parsedQuestions = parsed;
          } else if (Array.isArray(parsed.questions)) {
            parsedQuestions = parsed.questions;
          }
        }
      } catch {}

      // If details was a plain text description, fallback to the standard active placement set questions
      if (parsedQuestions.length === 0) {
        parsedQuestions = ACTIVE_PLACEMENT_SET.questions;
      }

      return {
        id: String(p._id),
        weekName: p.title || `Placement Questions — Set #${proposals.length - idx}`,
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
