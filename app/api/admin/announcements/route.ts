import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { Announcement, Admin, AuditLog } from "@/lib/db/models";

// GET /api/admin/announcements - Fetch announcements from MongoDB Atlas
export async function GET() {
  try {
    await dbConnect();
    // Sort by isPinned DESC first, then createdAt DESC
    const items = await Announcement.find().sort({ isPinned: -1, createdAt: -1 });

    const formatted = items.map((a: any) => ({
      id: String(a._id),
      title: a.title || "MCC Notice",
      text: a.content || "",
      description: a.content || "",
      poster: a.poster && a.poster.url ? a.poster : null,
      isPinned: Boolean(a.isPinned),
      status: a.status || "PUBLISHED",
      publishedDate: a.publishedAt ? new Date(a.publishedAt).toISOString().split("T")[0] : new Date(a.createdAt).toISOString().split("T")[0],
      createdAt: a.createdAt,
      isPublished: a.status === "PUBLISHED",
    }));

    return NextResponse.json({ announcements: formatted });
  } catch (error: any) {
    console.error("❌ [API GET /announcements] Database error:", error);
    return NextResponse.json({ message: "Failed to fetch announcements.", error: error.message }, { status: 500 });
  }
}

// POST /api/admin/announcements - Create announcement in MongoDB Atlas
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { title, text, description, poster, isPinned, status } = body;

    const contentText = text || description || "";
    if (!contentText || !String(contentText).trim()) {
      return NextResponse.json({ message: "Announcement description/content is required." }, { status: 400 });
    }

    // Unpin previous pinned announcements if this new announcement is pinned
    if (isPinned) {
      await Announcement.updateMany({}, { isPinned: false });
    }

    const adminDoc = await Admin.findOne({ email: "admin@mcc.edu" });

    const newDoc = await Announcement.create({
      title: title ? String(title).trim() : "MCC Event Notice",
      content: String(contentText).trim(),
      poster: poster && poster.url ? poster : null,
      isPinned: Boolean(isPinned),
      status: status || "PUBLISHED",
      publishedAt: new Date(),
      createdBy: adminDoc ? adminDoc._id : null,
    });

    await AuditLog.create({
      actorType: "ADMIN",
      action: "Created Announcement with Poster",
      module: "Announcements",
      targetId: newDoc._id,
      metadata: { title: newDoc.title, isPinned: newDoc.isPinned, hasPoster: Boolean(newDoc.poster) },
    });

    const formatted = {
      id: String(newDoc._id),
      title: newDoc.title,
      text: newDoc.content,
      description: newDoc.content,
      poster: newDoc.poster && newDoc.poster.url ? newDoc.poster : null,
      isPinned: Boolean(newDoc.isPinned),
      status: newDoc.status,
      publishedDate: new Date(newDoc.createdAt).toISOString().split("T")[0],
      createdAt: newDoc.createdAt,
      isPublished: newDoc.status === "PUBLISHED",
    };

    console.log(`✅ [MONGODB ATLAS] Created Announcement: ${formatted.id} (Pinned: ${formatted.isPinned})`);
    return NextResponse.json({ message: "Announcement published in database.", announcement: formatted }, { status: 201 });
  } catch (error: any) {
    console.error("❌ [API POST /announcements] Database error:", error);
    return NextResponse.json({ message: "Failed to create announcement.", error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/announcements - Update announcement in MongoDB Atlas
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, title, text, description, poster, isPinned, isPublished, status } = body;

    if (!id) {
      return NextResponse.json({ message: "Announcement ID required." }, { status: 400 });
    }

    const doc = await Announcement.findById(id);
    if (!doc) {
      return NextResponse.json({ message: "Announcement not found." }, { status: 404 });
    }

    // Handle pin status change: unpin others if this announcement becomes pinned
    if (isPinned === true && !doc.isPinned) {
      await Announcement.updateMany({}, { isPinned: false });
      doc.isPinned = true;
    } else if (isPinned === false) {
      doc.isPinned = false;
    }

    if (title !== undefined) doc.title = String(title).trim();

    const contentText = text !== undefined ? text : description;
    if (contentText !== undefined) doc.content = String(contentText).trim();

    if (poster !== undefined) doc.poster = poster && poster.url ? poster : null;

    if (status !== undefined) {
      doc.status = status;
    } else if (isPublished !== undefined) {
      doc.status = isPublished ? "PUBLISHED" : "DRAFT";
    }

    if (doc.status === "PUBLISHED" && !doc.publishedAt) {
      doc.publishedAt = new Date();
    }

    await doc.save();

    const formatted = {
      id: String(doc._id),
      title: doc.title || "MCC Notice",
      text: doc.content,
      description: doc.content,
      poster: doc.poster && doc.poster.url ? doc.poster : null,
      isPinned: Boolean(doc.isPinned),
      status: doc.status,
      publishedDate: doc.publishedAt ? new Date(doc.publishedAt).toISOString().split("T")[0] : new Date(doc.createdAt).toISOString().split("T")[0],
      createdAt: doc.createdAt,
      isPublished: doc.status === "PUBLISHED",
    };

    console.log(`✅ [MONGODB ATLAS] Updated Announcement: ${formatted.id}`);
    return NextResponse.json({ message: "Announcement updated in database.", announcement: formatted });
  } catch (error: any) {
    console.error("❌ [API PUT /announcements] Database error:", error);
    return NextResponse.json({ message: "Failed to update announcement.", error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/announcements - Delete announcement from MongoDB Atlas
export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID is required." }, { status: 400 });
    }

    await Announcement.findByIdAndDelete(id);

    console.log(`✅ [MONGODB ATLAS] Deleted Announcement ID: ${id}`);
    return NextResponse.json({ message: "Announcement deleted from database.", id });
  } catch (error: any) {
    console.error("❌ [API DELETE /announcements] Database error:", error);
    return NextResponse.json({ message: "Failed to delete announcement.", error: error.message }, { status: 500 });
  }
}
