import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { Responsibility, OfficeBearer, AuditLog } from "@/lib/db/models";

// GET /api/admin/assignments
// Returns all responsibilities with their currently-assigned OB (if any).
// This is the server-side source of truth for the assignment grid.
export async function GET() {
  try {
    await dbConnect();

    // Fetch all active 1:1 responsibilities (Placement Questions, General Quiz, Feed Community)
    const responsibilities = await Responsibility.find({
      status: "ACTIVE",
      name: { $ne: "Technical Games" },
    }).sort({ name: 1 });

    // Fetch all OBs that have a responsibilityId set (i.e. currently assigned)
    const assignedObs = await OfficeBearer.find({ responsibilityId: { $ne: null } }).populate("responsibilityId");

    // Build a lookup: responsibilityId -> OB doc
    const respToOb: Record<string, any> = {};
    for (const ob of assignedObs) {
      if (ob.responsibilityId) {
        const respId = String(ob.responsibilityId._id || ob.responsibilityId);
        respToOb[respId] = ob;
      }
    }

    // Build the assignments array the frontend expects
    const assignments = responsibilities.map((resp: any) => {
      const respId = String(resp._id);
      const assignedOb = respToOb[respId] || null;
      return {
        id: respId,
        activityName: resp.name,
        assignedObId: assignedOb ? String(assignedOb._id) : null,
        assignedObName: assignedOb ? assignedOb.name : null,
        department: assignedOb ? (assignedOb.department || "Computer Science & Engineering") : null,
        assignmentStatus: assignedOb ? "Assigned" : "Unassigned",
      };
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    console.error("❌ [API GET /assignments] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch assignments.", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/assignments
// Body: { activityId: string (Responsibility _id), obId: string (OfficeBearer _id) }
// Strict 1:1: clears old OB from this responsibility, clears old responsibility from this OB, then assigns.
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { activityId, obId } = body;

    if (!activityId || !obId) {
      return NextResponse.json(
        { message: "activityId and obId are required." },
        { status: 400 }
      );
    }

    // 1. Verify the responsibility exists
    const responsibility = await Responsibility.findById(activityId);
    if (!responsibility) {
      return NextResponse.json(
        { message: "Responsibility not found." },
        { status: 404 }
      );
    }

    // 2. Verify the OB exists
    const selectedOb = await OfficeBearer.findById(obId);
    if (!selectedOb) {
      return NextResponse.json(
        { message: "Office Bearer not found." },
        { status: 404 }
      );
    }

    // 2. Find currently assigned OB for this responsibility (to capture original value)
    const previousAssignedOb = await OfficeBearer.findOne({ responsibilityId: responsibility._id });

    // 3. STRICT 1:1 ENFORCEMENT
    // 3a. Clear any OB currently assigned to THIS responsibility
    await OfficeBearer.updateMany(
      { responsibilityId: responsibility._id },
      { $set: { responsibilityId: null } }
    );

    // 4. Assign the selected OB to this responsibility
    selectedOb.responsibilityId = responsibility._id;
    await selectedOb.save();

    // 5. Write Audit Log
    await AuditLog.create({
      actorType: "ADMIN",
      actorName: "Administrator",
      role: "Administrator",
      action: "RESPONSIBILITY_ASSIGNED",
      module: "Responsibility Management",
      targetId: responsibility._id,
      targetType: "RESPONSIBILITY",
      originalValue: {
        responsibility: responsibility.name,
        assignedObId: previousAssignedOb ? String(previousAssignedOb._id) : null,
        assignedObName: previousAssignedOb ? previousAssignedOb.name : null,
      },
      modifiedValue: {
        responsibility: responsibility.name,
        assignedObId: String(selectedOb._id),
        assignedObName: selectedOb.name,
      },
      metadata: { obId: String(selectedOb._id), obName: selectedOb.name, responsibility: responsibility.name },
    });

    console.log(`✅ [MONGODB ATLAS] Assigned OB "${selectedOb.name}" → Responsibility "${responsibility.name}"`);

    // 6. Return the updated assignment state (full list, same format as GET)
    const allResponsibilities = await Responsibility.find({
      status: "ACTIVE",
      name: { $ne: "Technical Games" },
    }).sort({ name: 1 });
    const allAssignedObs = await OfficeBearer.find({ responsibilityId: { $ne: null } }).populate("responsibilityId");
    const respToObMap: Record<string, any> = {};
    for (const ob of allAssignedObs) {
      if (ob.responsibilityId) {
        respToObMap[String(ob.responsibilityId._id || ob.responsibilityId)] = ob;
      }
    }

    const assignments = allResponsibilities.map((resp: any) => {
      const rId = String(resp._id);
      const aOb = respToObMap[rId] || null;
      return {
        id: rId,
        activityName: resp.name,
        assignedObId: aOb ? String(aOb._id) : null,
        assignedObName: aOb ? aOb.name : null,
        department: aOb ? (aOb.department || "Computer Science & Engineering") : null,
        assignmentStatus: aOb ? "Assigned" : "Unassigned",
      };
    });

    // Also return updated OB list so frontend can sync
    const allObs = await OfficeBearer.find().populate("responsibilityId").sort({ createdAt: -1 });
    const formattedObs = allObs.map((ob: any) => ({
      id: String(ob._id),
      name: ob.name,
      email: ob.email,
      department: ob.department || "Computer Science & Engineering",
      responsibility: ob.responsibilityId ? ob.responsibilityId.name : "Unassigned",
      status: ob.status === "ACTIVE" ? "Active" : "Inactive",
      joinedDate: ob.createdAt ? new Date(ob.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }));

    return NextResponse.json({
      message: `Assigned "${selectedOb.name}" to "${responsibility.name}" in MongoDB.`,
      assignments,
      users: formattedObs,
    });
  } catch (error: any) {
    console.error("❌ [API PUT /assignments] Error:", error);
    return NextResponse.json(
      { message: "Failed to assign responsibility.", error: error.message },
      { status: 500 }
    );
  }
}
