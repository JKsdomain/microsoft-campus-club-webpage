import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { LeaderboardWeek, TestAttempt, Admin, OfficeBearer, AuditLog } from "@/lib/db/models";
import { getAuthenticatedUser } from "@/lib/authHelper";

// GET /api/leaderboard
// Returns leaderboard publication state and calculated rankings from MongoDB TestAttempts strictly for PLACEMENT QUESTIONS.
export async function GET() {
  try {
    await dbConnect();

    // 1. Query current LeaderboardWeek document for Placement Questions
    let weekDoc = await LeaderboardWeek.findOne({
      activityType: { $in: ["PLACEMENT_QUESTIONS", "Placement Questions", "ALL"] }
    }).sort({ weekNumber: -1, createdAt: -1 });

    const isPublished = Boolean(weekDoc?.isPublished || weekDoc?.status === "PUBLISHED");
    const currentWeekNumber = weekDoc?.weekNumber || 1;

    // 2. Calculate rankings from persisted MongoDB TestAttempt documents strictly for Placement Questions
    const attempts = await TestAttempt.find({
      status: { $in: ["COMPLETED", "SUBMITTED"] },
      activityType: { $in: ["Placement Questions", "PLACEMENT_QUESTIONS", "PLACEMENT"] },
    })
      .sort({ score: -1, percentage: -1, submittedAt: 1 })
      .limit(200);

    // Deduplicate to take best attempt per student email
    const studentBestMap = new Map<string, any>();
    for (const att of attempts) {
      const key =
        att.studentEmailNormalized ||
        att.studentEmail?.toLowerCase() ||
        att.participant?.email?.toLowerCase() ||
        att.studentName ||
        att.participant?.username;

      if (!studentBestMap.has(key) || att.score > studentBestMap.get(key).score) {
        studentBestMap.set(key, att);
      }
    }

    const sortedUnique = Array.from(studentBestMap.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    const entries = sortedUnique.map((att, index) => ({
      rank: index + 1,
      username: att.studentName || att.participant?.username || "Student",
      email: att.studentEmail || att.participant?.email || "",
      department: att.department || "General",
      year: att.year || "1",
      section: att.section || "A",
      rollNumber: att.rollNumber || "N/A",
      score: att.score,
      totalQuestions: att.totalQuestions || 0,
      correctAnswersCount: att.correctAnswersCount || 0,
      wrongAnswersCount: att.wrongAnswersCount || 0,
      percentage: att.percentage,
      testType: "Placement Questions",
      timestamp: att.submittedAt
        ? new Date(att.submittedAt).toISOString().replace("T", " ").substring(0, 16)
        : "",
    }));

    if (!isPublished) {
      return NextResponse.json({
        isPublished: false,
        message: "Leaderboard will be available once it is published.",
        entries: [],
        publishedAt: null,
        publishedBy: null,
        publishedByRole: null,
        weekNumber: currentWeekNumber,
        activityType: "Placement Questions",
      });
    }

    return NextResponse.json({
      isPublished: true,
      publishedAt: weekDoc?.publishedAt ? new Date(weekDoc.publishedAt).toISOString() : null,
      publishedBy: weekDoc?.publishedBy || null,
      publishedByRole: weekDoc?.publishedByRole || null,
      entries,
      weekNumber: currentWeekNumber,
      activityType: "Placement Questions",
    });
  } catch (error: any) {
    console.error("❌ [API GET /leaderboard] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch placement leaderboard.", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/leaderboard
// Body: { action: "publish" | "unpublish" | "reset" }
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const { action = "publish" } = body;

    // 1. Authenticate Requester Session
    const cookieStore = await cookies();
    const authUser = await getAuthenticatedUser(cookieStore);

    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized. You must be logged in as an Administrator or Placement Office Bearer to perform this action." },
        { status: 401 }
      );
    }

    const role = authUser.role;
    const actorName = authUser.name;
    const actorEmail = authUser.email;
    const obResponsibility = authUser.responsibility || "";

    // 2. Server-Side Authorization Check
    if (role === "OFFICE_BEARER") {
      const normalizedResp = obResponsibility.toLowerCase().replace(/_/g, " ").trim();
      if (!normalizedResp.includes("placement")) {
        return NextResponse.json(
          {
            message: `Unauthorized: Office Bearer assigned to "${obResponsibility}" cannot manage the Placement Questions leaderboard. Only the Placement Questions OB or Admin is authorized.`,
          },
          { status: 403 }
        );
      }
    }

    // 3. Handle Reset action
    if (action === "reset") {
      let weekDoc = await LeaderboardWeek.findOne({
        activityType: { $in: ["PLACEMENT_QUESTIONS", "Placement Questions", "ALL"] }
      }).sort({ weekNumber: -1, createdAt: -1 });

      const newWeekNumber = weekDoc ? (weekDoc.weekNumber + 1) : 1;

      // Create fresh week record
      const newWeek = await LeaderboardWeek.create({
        weekNumber: newWeekNumber,
        activityType: "PLACEMENT_QUESTIONS",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "UNPUBLISHED",
        isPublished: false,
      });

      await AuditLog.create({
        actorId: actorEmail || null,
        actorType: role,
        actorName,
        actorEmail: actorEmail || undefined,
        role: role === "ADMIN" ? "Administrator" : "Office Bearer",
        action: "LEADERBOARD_RESET",
        module: "Leaderboard",
        targetId: newWeek._id,
        targetType: "LEADERBOARD_WEEK",
        metadata: {
          newWeekNumber,
          resetBy: actorName,
          timestamp: new Date(),
        },
      });

      console.log(`🔄 [MONGODB ATLAS] Leaderboard reset to Week ${newWeekNumber} by ${actorName}`);

      return NextResponse.json({
        success: true,
        message: `Leaderboard reset for new round (Week ${newWeekNumber}).`,
        isPublished: false,
        weekNumber: newWeekNumber,
      });
    }

    // 4. Update or Create MongoDB LeaderboardWeek Document
    let weekDoc = await LeaderboardWeek.findOne({
      activityType: { $in: ["PLACEMENT_QUESTIONS", "Placement Questions", "ALL"] }
    }).sort({ weekNumber: -1, createdAt: -1 });

    if (!weekDoc) {
      weekDoc = new LeaderboardWeek({
        weekNumber: 1,
        activityType: "PLACEMENT_QUESTIONS",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    const wasPublished = weekDoc.isPublished;
    const isPub = action !== "unpublish";
    weekDoc.isPublished = isPub;
    weekDoc.activityType = "PLACEMENT_QUESTIONS";
    weekDoc.status = isPub ? "PUBLISHED" : "UNPUBLISHED";
    weekDoc.publishedAt = isPub ? new Date() : null;
    weekDoc.publishedBy = isPub ? actorName : null;
    weekDoc.publishedByRole = isPub ? role : null;
    await weekDoc.save();

    // 5. Create AuditLog Record
    await AuditLog.create({
      actorId: actorEmail || null,
      actorType: role,
      actorName,
      actorEmail: actorEmail || undefined,
      role: role === "ADMIN" ? "Administrator" : "Office Bearer",
      action: isPub ? "LEADERBOARD_PUBLISHED" : "LEADERBOARD_UNPUBLISHED",
      module: "Leaderboard",
      targetId: weekDoc._id,
      targetType: "LEADERBOARD_WEEK",
      originalValue: { isPublished: wasPublished, status: wasPublished ? "PUBLISHED" : "UNPUBLISHED" },
      modifiedValue: { isPublished: isPub, status: isPub ? "PUBLISHED" : "UNPUBLISHED" },
      metadata: {
        publisher: actorName,
        publisherRole: role,
        activity: "Placement Questions",
        timestamp: new Date(),
      },
    });

    console.log(`✅ [MONGODB ATLAS] Placement Leaderboard ${isPub ? "PUBLISHED" : "UNPUBLISHED"} by ${actorName} (${role})`);

    return NextResponse.json({
      success: true,
      isPublished: isPub,
      publishedAt: weekDoc.publishedAt ? new Date(weekDoc.publishedAt).toISOString() : null,
      publishedBy: weekDoc.publishedBy,
      publishedByRole: weekDoc.publishedByRole,
      weekNumber: weekDoc.weekNumber,
      activityType: "Placement Questions",
    });
  } catch (error: any) {
    console.error("❌ [API POST /leaderboard] Error:", error);
    return NextResponse.json(
      { message: "Failed to update leaderboard publication status.", error: error.message },
      { status: 500 }
    );
  }
}

