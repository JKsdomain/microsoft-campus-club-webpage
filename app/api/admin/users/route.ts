import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { OfficeBearer, Responsibility, Admin, AuditLog } from "@/lib/db/models";

// GET /api/admin/users - Fetch all Office Bearers from MongoDB Atlas
export async function GET() {
  try {
    await dbConnect();
    const obs = await OfficeBearer.find().populate("responsibilityId").sort({ createdAt: -1 });

    const formatted = obs.map((ob: any) => ({
      id: String(ob._id),
      name: ob.name,
      email: ob.email,
      department: ob.department || "Computer Science & Engineering",
      responsibility: ob.responsibilityId ? ob.responsibilityId.name : "Unassigned",
      status: ob.status === "ACTIVE" ? "Active" : "Inactive",
      joinedDate: ob.createdAt ? new Date(ob.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }));

    return NextResponse.json({ users: formatted });
  } catch (error: any) {
    console.error("❌ [API GET /users] Error fetching office bearers:", error);
    return NextResponse.json({ message: "Failed to fetch office bearers from database.", error: error.message }, { status: 500 });
  }
}

// POST /api/admin/users - Create new Office Bearer in MongoDB Atlas
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, department, responsibility, status } = body;

    if (!name || !email) {
      return NextResponse.json({ message: "Name and Email are required." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check if user already exists in MongoDB
    const existingUser = await OfficeBearer.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json({ message: `An account with email '${cleanEmail}' already exists in MongoDB.` }, { status: 400 });
    }

    // Resolve Responsibility ObjectId from DB
    let respId = null;
    if (responsibility && responsibility !== "Unassigned") {
      const respDoc = await Responsibility.findOne({ name: { $regex: new RegExp(`^${responsibility}$`, "i") } });
      if (respDoc) {
        respId = respDoc._id;
      }
    }

    // Default admin reference
    const adminDoc = await Admin.findOne({ email: "admin@mcc.edu" });

    // Create Office Bearer in MongoDB Atlas
    const newOb = await OfficeBearer.create({
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash: "ob123", // Default password
      department: department || "Computer Science & Engineering",
      responsibilityId: respId,
      status: status === "Active" ? "ACTIVE" : "INACTIVE",
      createdBy: adminDoc ? adminDoc._id : null,
    });

    // Populate for clean response
    await newOb.populate("responsibilityId");

    // Write Audit Log to MongoDB Atlas
    await AuditLog.create({
      actorType: "ADMIN",
      action: `Created Office Bearer (${newOb.name})`,
      module: "User Management",
      targetId: newOb._id,
      metadata: { email: newOb.email, department: newOb.department },
    });

    const userObj = {
      id: String(newOb._id),
      name: newOb.name,
      email: newOb.email,
      department: newOb.department,
      responsibility: newOb.responsibilityId ? newOb.responsibilityId.name : "Unassigned",
      status: newOb.status === "ACTIVE" ? "Active" : "Inactive",
      joinedDate: new Date(newOb.createdAt).toISOString().split("T")[0],
    };

    console.log(`✅ [MONGODB ATLAS] Created new Office Bearer: ${userObj.email}`);
    return NextResponse.json({ message: "Office Bearer created successfully in database.", user: userObj }, { status: 201 });
  } catch (error: any) {
    console.error("❌ [API POST /users] Error creating office bearer:", error);
    return NextResponse.json({ message: "Failed to create office bearer in database.", error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/users - Update Office Bearer details or password in MongoDB Atlas
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, name, email, department, responsibility, status, newPassword } = body;

    if (!id) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    const ob = await OfficeBearer.findById(id);
    if (!ob) {
      return NextResponse.json({ message: "Office Bearer not found in database." }, { status: 404 });
    }

    if (name) ob.name = String(name).trim();
    if (email) ob.email = String(email).trim().toLowerCase();
    if (department) ob.department = department;
    if (status) ob.status = status === "Active" ? "ACTIVE" : "INACTIVE";
    if (newPassword) ob.passwordHash = newPassword;

    if (responsibility !== undefined) {
      if (responsibility === "Unassigned") {
        ob.responsibilityId = null;
      } else {
        const respDoc = await Responsibility.findOne({ name: { $regex: new RegExp(`^${responsibility}$`, "i") } });
        if (respDoc) {
          ob.responsibilityId = respDoc._id;
        }
      }
    }

    await ob.save();
    await ob.populate("responsibilityId");

    // Audit Log in MongoDB
    await AuditLog.create({
      actorType: "ADMIN",
      action: `Updated Office Bearer (${ob.name})`,
      module: "User Management",
      targetId: ob._id,
    });

    const userObj = {
      id: String(ob._id),
      name: ob.name,
      email: ob.email,
      department: ob.department,
      responsibility: ob.responsibilityId ? ob.responsibilityId.name : "Unassigned",
      status: ob.status === "ACTIVE" ? "Active" : "Inactive",
      joinedDate: new Date(ob.createdAt).toISOString().split("T")[0],
    };

    console.log(`✅ [MONGODB ATLAS] Updated Office Bearer: ${userObj.email}`);
    return NextResponse.json({ message: "Office Bearer updated in database.", user: userObj });
  } catch (error: any) {
    console.error("❌ [API PUT /users] Error updating office bearer:", error);
    return NextResponse.json({ message: "Failed to update office bearer in database.", error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/users - Remove Office Bearer from MongoDB Atlas
export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "User ID parameter is required." }, { status: 400 });
    }

    const ob = await OfficeBearer.findByIdAndDelete(id);
    if (!ob) {
      return NextResponse.json({ message: "Office Bearer not found." }, { status: 404 });
    }

    await AuditLog.create({
      actorType: "ADMIN",
      action: `Deleted Office Bearer (${ob.name})`,
      module: "User Management",
    });

    console.log(`✅ [MONGODB ATLAS] Deleted Office Bearer ID: ${id}`);
    return NextResponse.json({ message: "Office Bearer removed from database.", id });
  } catch (error: any) {
    console.error("❌ [API DELETE /users] Error deleting office bearer:", error);
    return NextResponse.json({ message: "Failed to delete office bearer.", error: error.message }, { status: 500 });
  }
}
