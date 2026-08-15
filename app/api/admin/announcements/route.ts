import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { Announcement, Admin, AuditLog } from "@/lib/db/models";

// GET /api/admin/announcements - Fetch announcements from MongoDB Atlas
export async function GET() {
  try {
    await dbConnect();
    const items = await Announcement.find().sort({ createdAt: -1 });

    const formatted = items.map((a: any) => ({
      id: String(a._id),
      text: a.content,
      publishedDate: a.publishedAt ? new Date(a.publishedAt).toISOString().split("T")[0] : new Date(a.createdAt).toISOString().split("T")[0],
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
    const { text } = body;

    if (!text || !String(text).trim()) {
      return NextResponse.json({ message: "Announcement text is required." }, { status: 400 });
    }

    const adminDoc = await Admin.findOne({ email: "admin@mcc.edu" });

    const newDoc = await Announcement.create({
      content: String(text).trim(),
      status: "PUBLISHED",
      publishedAt: new Date(),
      createdBy: adminDoc ? adminDoc._id : null,
    });

    await AuditLog.create({
      actorType: "ADMIN",
      action: "Created Announcement",
      module: "Announcements",
      targetId: newDoc._id,
    });

    const formatted = {
      id: String(newDoc._id),
      text: newDoc.content,
      publishedDate: new Date(newDoc.createdAt).toISOString().split("T")[0],
      isPublished: true,
    };

    console.log(`✅ [MONGODB ATLAS] Created Announcement: ${formatted.id}`);
    return NextResponse.json({ message: "Announcement created in database.", announcement: formatted }, { status: 201 });
  } catch (error: any) {
    console.error("❌ [API POST /announcements] Database error:", error);
    return NextResponse.json({ message: "Failed to create announcement.", error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/announcements - Update or toggle publish state in MongoDB Atlas
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, text, isPublished } = body;

    if (!id) {
      return NextResponse.json({ message: "Announcement ID required." }, { status: 400 });
    }

    const doc = await Announcement.findById(id);
    if (!doc) {
      return NextResponse.json({ message: "Announcement not found." }, { status: 404 });
    }

    if (text !== undefined) doc.content = String(text).trim();
    if (isPublished !== undefined) {
      doc.status = isPublished ? "PUBLISHED" : "DRAFT";
      if (isPublished) doc.publishedAt = new Date();
    }

    await doc.save();

    const formatted = {
      id: String(doc._id),
      text: doc.content,
      publishedDate: doc.publishedAt ? new Date(doc.publishedAt).toISOString().split("T")[0] : new Date(doc.createdAt).toISOString().split("T")[0],
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
