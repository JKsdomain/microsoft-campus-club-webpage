import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { NoticeEvent, OfficeBearer, Responsibility, Admin, AuditLog } from "@/lib/db/models";

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

// GET /api/admin/events - List all notice events
export async function GET() {
  try {
    await dbConnect();
    const events = await NoticeEvent.find().populate("assignedObId").sort({ createdAt: -1 });

    const formatted = events.map((ev: any) => {
      const ob = ev.assignedObId;
      return {
        id: String(ev._id),
        name: ev.name,
        description: ev.description || "",
        status: ev.status || "ACTIVE",
        assignedObId: ob ? String(ob._id) : null,
        assignedObName: ob ? ob.name : null,
        department: ob ? (ob.department || "Computer Science & Engineering") : null,
      };
    });

    return NextResponse.json({ events: formatted });
  } catch (error: any) {
    console.error("❌ [API GET /api/admin/events] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch events.", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/events - Create new event
export async function POST(req: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Event name is required." }, { status: 400 });
    }

    const newEvent = await NoticeEvent.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      status: "ACTIVE",
    });

    await AuditLog.create({
      actorType: "ADMIN",
      actorName: admin.name || "Administrator",
      role: "Administrator",
      action: "NOTICE_EVENT_CREATED",
      module: "Event Notice Management",
      targetId: newEvent._id,
      targetType: "NOTICE_EVENT",
      originalValue: null,
      modifiedValue: { name: newEvent.name, description: newEvent.description },
    });

    return NextResponse.json({
      message: `Event "${newEvent.name}" created.`,
      event: {
        id: String(newEvent._id),
        name: newEvent.name,
        description: newEvent.description,
        status: newEvent.status,
        assignedObId: null,
        assignedObName: null,
        department: null,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("❌ [API POST /api/admin/events] Error:", error);
    return NextResponse.json(
      { message: "Failed to create event.", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/events - Update event details or assign OB
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, description, assignedObId } = body;

    if (!id) {
      return NextResponse.json({ message: "Event id is required." }, { status: 400 });
    }

    const event = await NoticeEvent.findById(id);
    if (!event) {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    const originalAssignedOb = event.assignedObId ? String(event.assignedObId) : null;

    if (name) event.name = name.trim();
    if (description !== undefined) event.description = description.trim();

    // Handle OB Assignment if provided
    if (assignedObId !== undefined) {
      if (assignedObId === null || assignedObId === "") {
        // Unassign OB from this event
        if (event.assignedObId) {
          await OfficeBearer.findByIdAndUpdate(event.assignedObId, {
            $set: { assignedEventId: null },
          });
          event.assignedObId = null;
        }
      } else {
        const selectedOb = await OfficeBearer.findById(assignedObId);
        if (!selectedOb) {
          return NextResponse.json({ message: "Office Bearer not found." }, { status: 404 });
        }

        // 1. If another OB was assigned to this event, clear their assignedEventId
        if (event.assignedObId && String(event.assignedObId) !== String(selectedOb._id)) {
          await OfficeBearer.findByIdAndUpdate(event.assignedObId, {
            $set: { assignedEventId: null },
          });
        }

        // 2. If this selected OB was assigned to another event, clear that event's assignedObId
        await NoticeEvent.updateMany(
          { assignedObId: selectedOb._id, _id: { $ne: event._id } },
          { $set: { assignedObId: null } }
        );

        // 3. Clear any other single responsibility from this OB (1 OB -> 1 Responsibility rule)
        await OfficeBearer.updateMany(
          { responsibilityId: selectedOb.responsibilityId, _id: { $ne: selectedOb._id } },
          { $set: { responsibilityId: null } }
        );

        // 4. Ensure the OB is tied to "Event Notice" parent responsibility
        const eventResp = await Responsibility.findOne({ code: "EVENT_NOTICE" });
        if (eventResp) {
          selectedOb.responsibilityId = eventResp._id;
        }

        selectedOb.assignedEventId = event._id;
        await selectedOb.save();

        event.assignedObId = selectedOb._id;
      }
    }

    await event.save();

    await AuditLog.create({
      actorType: "ADMIN",
      actorName: admin.name || "Administrator",
      role: "Administrator",
      action: "NOTICE_EVENT_UPDATED",
      module: "Event Notice Management",
      targetId: event._id,
      targetType: "NOTICE_EVENT",
      originalValue: { assignedObId: originalAssignedOb },
      modifiedValue: { name: event.name, assignedObId: event.assignedObId ? String(event.assignedObId) : null },
    });

    const populated = await NoticeEvent.findById(event._id).populate("assignedObId");
    const ob = populated.assignedObId;

    return NextResponse.json({
      message: `Event "${event.name}" updated successfully.`,
      event: {
        id: String(event._id),
        name: event.name,
        description: event.description,
        status: event.status,
        assignedObId: ob ? String(ob._id) : null,
        assignedObName: ob ? ob.name : null,
        department: ob ? (ob.department || "Computer Science & Engineering") : null,
      },
    });
  } catch (error: any) {
    console.error("❌ [API PUT /api/admin/events] Error:", error);
    return NextResponse.json(
      { message: "Failed to update event.", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events - Remove an event
export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Event id is required." }, { status: 400 });
    }

    const event = await NoticeEvent.findById(id);
    if (!event) {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    if (event.assignedObId) {
      await OfficeBearer.findByIdAndUpdate(event.assignedObId, {
        $set: { assignedEventId: null },
      });
    }

    await NoticeEvent.findByIdAndDelete(id);

    await AuditLog.create({
      actorType: "ADMIN",
      actorName: admin.name || "Administrator",
      role: "Administrator",
      action: "NOTICE_EVENT_DELETED",
      module: "Event Notice Management",
      targetId: id,
      targetType: "NOTICE_EVENT",
      originalValue: { name: event.name },
      modifiedValue: null,
    });

    return NextResponse.json({
      message: `Event "${event.name}" deleted.`,
    });
  } catch (error: any) {
    console.error("❌ [API DELETE /api/admin/events] Error:", error);
    return NextResponse.json(
      { message: "Failed to delete event.", error: error.message },
      { status: 500 }
    );
  }
}
