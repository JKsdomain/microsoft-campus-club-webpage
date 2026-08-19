import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { LeaderboardWeek, TestAttempt, Admin, OfficeBearer, AuditLog } from "@/lib/db/models";

// GET /api/leaderboard
// Returns leaderboard publication state and calculated rankings from MongoDB TestAttempts.
// If unpublished, returns { isPublished: false, message: "Leaderboard will be available once it is published.", entries: [] }
export async function GET(req: Request) {
  try {
    await dbConnect();

    // 1. Query current LeaderboardWeek document
    let weekDoc = await LeaderboardWeek.findOne().sort({ createdAt: -1 });
    const isPublished = Boolean(weekDoc?.isPublished || weekDoc?.status === "PUBLISHED");

    // 2. Calculate rankings from persisted MongoDB TestAttempt documents
    const attempts = await TestAttempt.find({
      status: { $in: ["COMPLETED", "SUBMITTED"] },
    })
      .sort({ score: -1, percentage: -1, submittedAt: 1 })
      .limit(100);

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
      percentage: att.percentage,
      totalQuestions: att.totalQuestions,
      testType: att.activityType || att.testType,
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
        weekNumber: weekDoc?.weekNumber || 1,
      });
    }

    return NextResponse.json({
      isPublished: true,
      publishedAt: weekDoc?.publishedAt ? new Date(weekDoc.publishedAt).toISOString() : null,
      publishedBy: weekDoc?.publishedBy || null,
      publishedByRole: weekDoc?.publishedByRole || null,
      entries,
      weekNumber: weekDoc?.weekNumber || 1,
    });
  } catch (error: any) {
    console.error("❌ [API GET /leaderboard] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch leaderboard.", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/leaderboard
// Body: { action: "publish" | "unpublish", activityType?: string }
// Server-side authenticated publish control:
// - Admin: Allowed to publish/unpublish.
// - Responsible OB: Allowed ONLY if assigned to the corresponding activity.
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const { action = "publish", activityType } = body;

    // 1. Authenticate Requester Session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("mcc_admin_session")?.value;
    const obSession = cookieStore.get("mcc_ob_session")?.value;

    let role: "ADMIN" | "OFFICE_BEARER" | null = null;
    let actorName = "";
    let actorEmail = "";
    let obResponsibility = "";

    if (adminSession) {
      role = "ADMIN";
      const cleanEmail = decodeURIComponent(adminSession).trim().toLowerCase();
      actorEmail = cleanEmail;
      actorName = "Administrator";

      const adminDoc = await Admin.findOne({ email: cleanEmail, status: "ACTIVE" });
      if (adminDoc) {
        actorName = adminDoc.name;
      }
    } else if (obSession) {
      role = "OFFICE_BEARER";
      const cleanEmail = decodeURIComponent(obSession).trim().toLowerCase();
      actorEmail = cleanEmail;
      actorName = "Office Bearer";

      const obDoc = await OfficeBearer.findOne({ email: cleanEmail, status: "ACTIVE" }).populate("responsibilityId");
      if (obDoc) {
        actorName = obDoc.name;
        obResponsibility = obDoc.responsibilityId ? (obDoc.responsibilityId as any).name : "Unassigned";
      }
    }

    if (!role) {
      return NextResponse.json(
        { message: "Unauthorized. You must be logged in as an Administrator or Office Bearer to perform this action." },
        { status: 401 }
      );
    }

    // 2. Server-Side Authorization Check
    if (role === "OFFICE_BEARER") {
      if (obResponsibility === "Unassigned" || !obResponsibility) {
        return NextResponse.json(
          { message: "Unauthorized: You do not have an assigned responsibility to publish leaderboards." },
          { status: 403 }
        );
      }

      // If a specific activityType is specified, verify it matches the OB's assigned responsibility
      if (activityType) {
        const normalizedAct = activityType.toLowerCase().replace(/_/g, " ").trim();
        const normalizedResp = obResponsibility.toLowerCase().replace(/_/g, " ").trim();

        if (!normalizedResp.includes(normalizedAct) && !normalizedAct.includes(normalizedResp)) {
          return NextResponse.json(
            {
              message: `Unauthorized: You are assigned to "${obResponsibility}" and cannot publish the leaderboard for "${activityType}".`,
            },
            { status: 403 }
          );
        }
      } else {
        // General leaderboard publish allowed for responsible OBs of General Quiz and Placement Questions
        if (obResponsibility !== "General Quiz" && obResponsibility !== "Placement Questions") {
          return NextResponse.json(
            {
              message: `Unauthorized: Office Bearer assigned to "${obResponsibility}" cannot publish the assessment leaderboard.`,
            },
            { status: 403 }
          );
        }
      }
    }

    // 3. Update or Create MongoDB LeaderboardWeek Document
    let weekDoc = await LeaderboardWeek.findOne().sort({ createdAt: -1 });
    if (!weekDoc) {
      weekDoc = new LeaderboardWeek({
        weekNumber: 1,
        activityType: activityType || "ALL",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    const isPub = action !== "unpublish";
    weekDoc.isPublished = isPub;
    weekDoc.status = isPub ? "PUBLISHED" : "UNPUBLISHED";
    weekDoc.publishedAt = isPub ? new Date() : null;
    weekDoc.publishedBy = isPub ? actorName : null;
    weekDoc.publishedByRole = isPub ? role : null;
    await weekDoc.save();

    // 4. Create AuditLog Record
    await AuditLog.create({
      actorId: actorEmail || null,
      actorType: role,
      action: isPub ? "LEADERBOARD_PUBLISHED" : "LEADERBOARD_UNPUBLISHED",
      module: "Leaderboard",
      targetId: weekDoc._id,
      metadata: {
        publisher: actorName,
        publisherRole: role,
        activity: activityType || obResponsibility || "Weekly Assessment",
        timestamp: new Date(),
      },
    });

    console.log(`✅ [MONGODB ATLAS] Leaderboard ${isPub ? "PUBLISHED" : "UNPUBLISHED"} by ${actorName} (${role})`);

    return NextResponse.json({
      success: true,
      isPublished: isPub,
      publishedAt: weekDoc.publishedAt ? new Date(weekDoc.publishedAt).toISOString() : null,
      publishedBy: weekDoc.publishedBy,
      publishedByRole: weekDoc.publishedByRole,
      weekNumber: weekDoc.weekNumber,
    });
  } catch (error: any) {
    console.error("❌ [API POST /leaderboard] Error:", error);
    return NextResponse.json(
      { message: "Failed to update leaderboard publication status.", error: error.message },
      { status: 500 }
    );
  }
}
