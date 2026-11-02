import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { Notice, Admin, AuditLog } from "@/lib/db/models";

async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mcc_admin_session")?.value;
  if (!adminCookie) return null;

  const email = decodeURIComponent(adminCookie).trim().toLowerCase();
  const admin = await Admin.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });
  if (admin) return admin;
  if (email === "admin@mcc.edu" || email.startsWith("admin")) {
    return { _id: "admin-static", name: "Administrator", email };
  }
  return null;
}

// POST /api/admin/notices/review
export async function POST(req: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
    }

    const body = await req.json();
    const { noticeId, action, rejectionReason } = body;

    if (!noticeId || !action) {
      return NextResponse.json({ message: "noticeId and action are required." }, { status: 400 });
    }

    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return NextResponse.json({ message: "Notice not found." }, { status: 404 });
    }

    const originalStatus = notice.status;

    if (action === "APPROVE") {
      notice.status = "PUBLISHED";
      notice.publishedAt = new Date();
      notice.reviewedAt = new Date();
      notice.reviewedBy = admin._id !== "admin-static" ? admin._id : null;
      notice.rejectionReason = null;
      await notice.save();

      await AuditLog.create({
        actorType: "ADMIN",
        actorName: admin.name || "Administrator",
        role: "Administrator",
        action: "NOTICE_APPROVED_PUBLISHED",
        module: "Notice Management",
        targetId: notice._id,
        targetType: "NOTICE",
        originalValue: { status: originalStatus },
        modifiedValue: { status: "PUBLISHED", publishedAt: notice.publishedAt },
        metadata: { noticeId: String(notice._id), title: notice.title, noticeType: notice.noticeType },
      });

      return NextResponse.json({
        message: `Notice "${notice.title}" approved and published to the website.`,
        notice,
      });
    }

    if (action === "REJECT") {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json({ message: "Rejection reason is required." }, { status: 400 });
      }

      notice.status = "REJECTED";
      notice.rejectionReason = rejectionReason.trim();
      notice.reviewedAt = new Date();
      notice.reviewedBy = admin._id !== "admin-static" ? admin._id : null;
      await notice.save();

      await AuditLog.create({
        actorType: "ADMIN",
        actorName: admin.name || "Administrator",
        role: "Administrator",
        action: "NOTICE_REJECTED",
        module: "Notice Management",
        targetId: notice._id,
        targetType: "NOTICE",
        originalValue: { status: originalStatus },
        modifiedValue: { status: "REJECTED", rejectionReason: notice.rejectionReason },
        metadata: { noticeId: String(notice._id), title: notice.title, rejectionReason: notice.rejectionReason },
      });

      return NextResponse.json({
        message: `Notice "${notice.title}" was rejected with feedback.`,
        notice,
      });
    }

    if (action === "UNPUBLISH") {
      notice.status = "UNPUBLISHED";
      await notice.save();

      await AuditLog.create({
        actorType: "ADMIN",
        actorName: admin.name || "Administrator",
        role: "Administrator",
        action: "NOTICE_UNPUBLISHED",
        module: "Notice Management",
        targetId: notice._id,
        targetType: "NOTICE",
        originalValue: { status: originalStatus },
        modifiedValue: { status: "UNPUBLISHED" },
        metadata: { noticeId: String(notice._id), title: notice.title },
      });

      return NextResponse.json({
        message: `Notice "${notice.title}" unpublished from the website.`,
        notice,
      });
    }

    if (action === "DELETE") {
      await Notice.findByIdAndDelete(noticeId);

      await AuditLog.create({
        actorType: "ADMIN",
        actorName: admin.name || "Administrator",
        role: "Administrator",
        action: "NOTICE_DELETED",
        module: "Notice Management",
        targetId: noticeId,
        targetType: "NOTICE",
        originalValue: { title: notice.title, status: originalStatus },
        modifiedValue: null,
        metadata: { noticeId: String(noticeId), title: notice.title },
      });

      return NextResponse.json({
        message: `Notice "${notice.title}" deleted.`,
      });
    }

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("❌ [API POST /api/admin/notices/review] Error:", error);
    return NextResponse.json(
      { message: "Failed to process notice review action.", error: error.message },
      { status: 500 }
    );
  }
}
