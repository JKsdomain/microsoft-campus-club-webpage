import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import {
  ProposalModel,
  AuditLog,
  TestAttempt,
  Announcement,
  LeaderboardWeek,
} from "@/lib/db/models";
import { getAuthenticatedUser } from "@/lib/authHelper";

// GET /api/admin/data-cleanup
// Returns counts for all dynamic data collections for administrative cleanup inspection
export async function GET() {
  try {
    const cookieStore = await cookies();
    const authUser = await getAuthenticatedUser(cookieStore);

    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized. Administrator access required." },
        { status: 403 }
      );
    }

    await dbConnect();

    const [
      totalProposals,
      pendingProposals,
      approvedProposals,
      rejectedProposals,
      archivedProposals,
      totalAuditLogs,
      totalTestAttempts,
      totalAnnouncements,
      totalFeeds,
    ] = await Promise.all([
      ProposalModel.countDocuments(),
      ProposalModel.countDocuments({ status: { $in: ["PENDING", "PENDING_REAPPROVAL", "DRAFT"] } }),
      ProposalModel.countDocuments({ status: "APPROVED" }),
      ProposalModel.countDocuments({ status: "REJECTED" }),
      ProposalModel.countDocuments({ status: "ARCHIVED" }),
      AuditLog.countDocuments(),
      TestAttempt.countDocuments(),
      Announcement.countDocuments(),
      ProposalModel.countDocuments({ type: "FEED" }),
    ]);

    return NextResponse.json({
      counts: {
        proposals: {
          total: totalProposals,
          pending: pendingProposals,
          approved: approvedProposals,
          rejected: rejectedProposals,
          archived: archivedProposals,
        },
        auditLogs: {
          total: totalAuditLogs,
        },
        testAttempts: {
          total: totalTestAttempts,
        },
        announcements: {
          total: totalAnnouncements,
        },
        feeds: {
          total: totalFeeds,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ [API GET /admin/data-cleanup] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch collection counts.", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/data-cleanup
// Body: { target: "proposals" | "auditLogs" | "testAttempts" | "announcements" | "feeds" | "all", subFilter?: string, olderThanDays?: number }
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const authUser = await getAuthenticatedUser(cookieStore);

    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized. Administrator access required." },
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await req.json();
    const { target, subFilter, olderThanDays } = body;

    let deletedCount = 0;
    const actorName = authUser.name || "Administrator";
    const actorEmail = authUser.email || "";

    let dateFilter: any = {};
    if (olderThanDays && olderThanDays > 0) {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $lte: cutoffDate } };
    }

    if (target === "proposals") {
      let query: any = { ...dateFilter };
      if (subFilter === "PENDING") {
        query.status = { $in: ["PENDING", "PENDING_REAPPROVAL", "DRAFT"] };
      } else if (subFilter === "APPROVED") {
        query.status = "APPROVED";
      } else if (subFilter === "REJECTED") {
        query.status = "REJECTED";
      } else if (subFilter === "ARCHIVED") {
        query.status = "ARCHIVED";
      }
      // If no subFilter or "ALL", deletes matching query

      const res = await ProposalModel.deleteMany(query);
      deletedCount = res.deletedCount || 0;
    } else if (target === "auditLogs") {
      const query: any = { ...dateFilter };
      const res = await AuditLog.deleteMany(query);
      deletedCount = res.deletedCount || 0;
    } else if (target === "testAttempts") {
      const query: any = { ...dateFilter };
      const res = await TestAttempt.deleteMany(query);
      deletedCount = res.deletedCount || 0;

      // Also reset current leaderboard week status if requested
      if (subFilter === "with_leaderboard_reset") {
        await LeaderboardWeek.updateMany({}, { $set: { isPublished: false, status: "UNPUBLISHED" } });
      }
    } else if (target === "announcements") {
      const query: any = { ...dateFilter };
      if (subFilter === "DRAFT") {
        query.published = false;
      } else if (subFilter === "PUBLISHED") {
        query.published = true;
      }
      const res = await Announcement.deleteMany(query);
      deletedCount = res.deletedCount || 0;
    } else if (target === "feeds") {
      const query: any = { type: "FEED", ...dateFilter };
      const res = await ProposalModel.deleteMany(query);
      deletedCount = res.deletedCount || 0;
    } else if (target === "all") {
      const [resProposals, resAttempts, resAnnouncements, resLogs] = await Promise.all([
        ProposalModel.deleteMany({}),
        TestAttempt.deleteMany({}),
        Announcement.deleteMany({}),
        AuditLog.deleteMany({}),
      ]);
      deletedCount =
        (resProposals.deletedCount || 0) +
        (resAttempts.deletedCount || 0) +
        (resAnnouncements.deletedCount || 0) +
        (resLogs.deletedCount || 0);

      await LeaderboardWeek.updateMany({}, { $set: { isPublished: false, status: "UNPUBLISHED" } });
    } else {
      return NextResponse.json({ message: "Invalid target specified." }, { status: 400 });
    }

    // Log the purge action to AuditLog (if auditLogs weren't wiped or if wiping something else)
    if (target !== "auditLogs" && target !== "all") {
      await AuditLog.create({
        actorType: "ADMIN",
        actorName,
        actorEmail,
        role: "Administrator",
        action: "DATA_PURGED",
        module: "System Administration",
        metadata: {
          target,
          subFilter: subFilter || "ALL",
          olderThanDays: olderThanDays || null,
          deletedCount,
          timestamp: new Date(),
        },
      });
    }

    console.log(`🧹 [DATA CLEANUP] Admin ${actorName} purged ${deletedCount} records from "${target}".`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} record(s) from ${target}.`,
      deletedCount,
    });
  } catch (error: any) {
    console.error("❌ [API POST /admin/data-cleanup] Error:", error);
    return NextResponse.json(
      { message: "Failed to delete data.", error: error.message },
      { status: 500 }
    );
  }
}
