import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { OfficeBearer, ProposalModel, TestAttempt, Announcement } from "@/lib/db/models";

// GET /api/admin/dashboard-stats
// Computes real-time statistics directly from MongoDB Atlas without fake numbers.
export async function GET() {
  try {
    await dbConnect();

    // 1. Office Bearers
    const totalObs = await OfficeBearer.countDocuments();
    const activeObs = await OfficeBearer.countDocuments({ status: "ACTIVE" });

    // 2. Department Breakdown
    const obs = await OfficeBearer.find({ status: "ACTIVE" });
    const deptCounts: Record<string, number> = {
      CSE: 0,
      IT: 0,
      ECE: 0,
      EEE: 0,
      Other: 0,
    };

    obs.forEach((ob) => {
      const dept = ob.department || "";
      if (dept.includes("Computer Science") || dept.includes("CSE") || dept.includes("Artificial Intelligence")) deptCounts["CSE"]++;
      else if (dept.includes("Information") || dept.includes("IT")) deptCounts["IT"]++;
      else if (dept.includes("Electronics") || dept.includes("ECE")) deptCounts["ECE"]++;
      else if (dept.includes("Electrical") || dept.includes("EEE")) deptCounts["EEE"]++;
      else deptCounts["Other"]++;
    });

    // 3. Test Attempts & Activity Participation from MongoDB
    const placementAttemptsCount = await TestAttempt.countDocuments({
      activityType: { $in: ["Placement Questions", "PLACEMENT_QUESTIONS", "PLACEMENT"] },
      status: { $in: ["COMPLETED", "SUBMITTED"] },
    });

    const quizAttemptsCount = await TestAttempt.countDocuments({
      activityType: { $in: ["General Quiz", "GENERAL_QUIZ", "QUIZ"] },
      status: { $in: ["COMPLETED", "SUBMITTED"] },
    });

    const feedPostsCount = await ProposalModel.countDocuments({
      type: { $in: ["FEED", "FEED_COMMUNITY", "FEED_POST"] },
      status: "APPROVED",
    });

    const techGamesCount = await ProposalModel.countDocuments({
      type: { $in: ["TECHNICAL_GAMES", "TECH_GAMES"] },
      status: "APPROVED",
    });

    const distinctStudents = await TestAttempt.distinct("studentEmailNormalized");
    const totalParticipants = distinctStudents.length;

    const totalProposals = await ProposalModel.countDocuments({
      status: { $in: ["PENDING", "APPROVED", "PENDING_REAPPROVAL"] },
    });

    const activeAnnouncements = await Announcement.countDocuments({
      status: "PUBLISHED",
    });

    return NextResponse.json({
      totalObs,
      activeObs,
      totalParticipants,
      placementAttemptsCount,
      quizAttemptsCount,
      feedPostsCount,
      techGamesCount,
      totalProposals,
      activeAnnouncements,
      deptCounts,
    });
  } catch (error: any) {
    console.error("❌ [DASHBOARD STATS API ERROR]:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard stats.", error: error.message },
      { status: 500 }
    );
  }
}
