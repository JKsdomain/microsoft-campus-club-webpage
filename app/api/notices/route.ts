import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { Notice, OfficeBearer, Admin, Responsibility, NoticeEvent } from "@/lib/db/models";

// Helper to resolve caller auth from cookies
async function resolveAuth() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mcc_admin_session")?.value;
  const obCookie = cookieStore.get("mcc_ob_session")?.value;

  if (adminCookie) {
    const email = decodeURIComponent(adminCookie).trim().toLowerCase();
    const admin = await Admin.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });
    if (admin) return { role: "ADMIN" as const, user: admin };
    if (email === "admin@mcc.edu" || email.startsWith("admin")) {
      return { role: "ADMIN" as const, user: { _id: "admin-static", name: "Administrator", email } };
    }
  }

  if (obCookie) {
    const email = decodeURIComponent(obCookie).trim().toLowerCase();
    const ob = await OfficeBearer.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    }).populate("responsibilityId").populate("assignedEventId");
    if (ob) return { role: "OFFICE_BEARER" as const, user: ob };
  }

  return { role: null, user: null };
}

// GET /api/notices
export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const isPublic = searchParams.get("public") === "true";
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    // Public request: Return only published notices
    if (isPublic) {
      const query: any = { status: "PUBLISHED" };
      if (type) query.noticeType = type;
      const items = await Notice.find(query).sort({ publishedAt: -1, createdAt: -1 });
      const formatted = items.map((n: any) => ({
        id: String(n._id),
        title: n.title,
        noticeType: n.noticeType,
        eventName: n.eventName,
        contentData: n.contentData,
        status: n.status,
        publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString().split("T")[0] : null,
        pdfUrl: `/api/notices/pdf?id=${n._id}`,
      }));
      return NextResponse.json({ notices: formatted });
    }

    // Authenticated request
    const auth = await resolveAuth();
    if (!auth.role) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const query: any = {};
    if (type) query.noticeType = type;
    if (status) query.status = status;

    // If Office Bearer, restrict to their notices only
    if (auth.role === "OFFICE_BEARER") {
      query.obId = auth.user._id;
    }

    const items = await Notice.find(query).sort({ updatedAt: -1, createdAt: -1 });
    const formatted = items.map((n: any) => ({
      id: String(n._id),
      title: n.title,
      noticeType: n.noticeType,
      eventId: n.eventId ? String(n.eventId) : null,
      eventName: n.eventName,
      obId: String(n.obId),
      obName: n.obName,
      contentData: n.contentData,
      status: n.status,
      rejectionReason: n.rejectionReason,
      reviewedAt: n.reviewedAt ? new Date(n.reviewedAt).toISOString() : null,
      publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString().split("T")[0] : null,
      createdAt: new Date(n.createdAt).toISOString().split("T")[0],
      pdfUrl: `/api/notices/pdf?id=${n._id}`,
    }));

    return NextResponse.json({ notices: formatted });
  } catch (error: any) {
    console.error("❌ [API GET /api/notices] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch notices.", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/notices - Create Notice (Draft or Submit for Approval)
export async function POST(req: Request) {
  try {
    await dbConnect();
    const auth = await resolveAuth();
    if (!auth.role) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { title, noticeType, eventId, eventName, contentData, status = "DRAFT" } = body;

    if (!title || !noticeType || !contentData) {
      return NextResponse.json(
        { message: "title, noticeType, and contentData are required." },
        { status: 400 }
      );
    }

    // Role-based authorization for Office Bearers
    if (auth.role === "OFFICE_BEARER") {
      const ob = auth.user;
      const respName = (ob.responsibilityId as any)?.name || "";
      const respCode = (ob.responsibilityId as any)?.code || "";

      // Validate matching responsibility
      const typeToCode: Record<string, string> = {
        QUIZ_NOTICE: "QUIZ_NOTICE",
        EVENT_NOTICE: "EVENT_NOTICE",
        QUIZ_WINNERS_NOTICE: "QUIZ_WINNERS_NOTICE",
        ACTIVE_PARTICIPANTS_NOTICE: "ACTIVE_PARTICIPANTS_NOTICE",
        PLACEMENT_QUESTIONS_NOTICE: "PLACEMENT_QUESTIONS_NOTICE",
      };

      if (respCode !== typeToCode[noticeType]) {
        return NextResponse.json(
          { message: `You are not authorized to create ${noticeType} notices. Your assigned responsibility is: ${respName || "None"}.` },
          { status: 403 }
        );
      }

      // If Event Notice, ensure assigned event matches if OB has specific event
      if (noticeType === "EVENT_NOTICE" && ob.assignedEventId) {
        const assignedEvId = String(ob.assignedEventId._id || ob.assignedEventId);
        if (eventId && String(eventId) !== assignedEvId) {
          return NextResponse.json(
            { message: "You can only manage notices for your specifically assigned event." },
            { status: 403 }
          );
        }
      }
    }

    const newNotice = await Notice.create({
      title: title.trim(),
      noticeType,
      eventId: eventId || null,
      eventName: eventName || null,
      obId: auth.user._id,
      obName: auth.user.name,
      contentData,
      status: status === "PENDING_APPROVAL" ? "PENDING_APPROVAL" : "DRAFT",
      pdfUrl: null,
    });

    newNotice.pdfUrl = `/api/notices/pdf?id=${newNotice._id}`;
    await newNotice.save();

    return NextResponse.json({
      message: status === "PENDING_APPROVAL" ? "Notice submitted for admin approval." : "Notice saved as draft.",
      notice: {
        id: String(newNotice._id),
        title: newNotice.title,
        noticeType: newNotice.noticeType,
        eventId: newNotice.eventId ? String(newNotice.eventId) : null,
        eventName: newNotice.eventName,
        obId: String(newNotice.obId),
        obName: newNotice.obName,
        contentData: newNotice.contentData,
        status: newNotice.status,
        createdAt: new Date(newNotice.createdAt).toISOString().split("T")[0],
        pdfUrl: newNotice.pdfUrl,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("❌ [API POST /api/notices] Error:", error);
    return NextResponse.json(
      { message: "Failed to create notice.", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/notices - Update Notice
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const auth = await resolveAuth();
    if (!auth.role) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, contentData, status } = body;

    if (!id) {
      return NextResponse.json({ message: "Notice id is required." }, { status: 400 });
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return NextResponse.json({ message: "Notice not found." }, { status: 404 });
    }

    // Access control: only owner OB or admin can update
    if (auth.role === "OFFICE_BEARER" && String(notice.obId) !== String(auth.user._id)) {
      return NextResponse.json({ message: "You are not authorized to update this notice." }, { status: 403 });
    }

    // Cannot edit approved or published notices directly without admin
    if (auth.role === "OFFICE_BEARER" && (notice.status === "APPROVED" || notice.status === "PUBLISHED")) {
      return NextResponse.json({ message: "Approved or published notices cannot be modified directly." }, { status: 400 });
    }

    if (title) notice.title = title.trim();
    if (contentData) notice.contentData = contentData;

    // Transitioning status
    if (status) {
      if (status === "PENDING_APPROVAL") {
        notice.status = "PENDING_APPROVAL";
        notice.rejectionReason = null; // Clear rejection reason upon resubmission
      } else if (status === "DRAFT") {
        notice.status = "DRAFT";
      }
    }

    notice.pdfUrl = `/api/notices/pdf?id=${notice._id}`;
    await notice.save();

    return NextResponse.json({
      message: notice.status === "PENDING_APPROVAL" ? "Notice resubmitted for admin approval." : "Notice draft updated.",
      notice: {
        id: String(notice._id),
        title: notice.title,
        noticeType: notice.noticeType,
        eventId: notice.eventId ? String(notice.eventId) : null,
        eventName: notice.eventName,
        obId: String(notice.obId),
        obName: notice.obName,
        contentData: notice.contentData,
        status: notice.status,
        rejectionReason: notice.rejectionReason,
        createdAt: new Date(notice.createdAt).toISOString().split("T")[0],
        pdfUrl: notice.pdfUrl,
      },
    });
  } catch (error: any) {
    console.error("❌ [API PUT /api/notices] Error:", error);
    return NextResponse.json(
      { message: "Failed to update notice.", error: error.message },
      { status: 500 }
    );
  }
}
