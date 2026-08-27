import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { OfficeBearer, Admin } from "@/lib/db/models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { message: "Email, password, and role are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    console.log(`🔐 [AUTH API] Processing ${role.toUpperCase()} login attempt for: ${cleanEmail}`);

    // Helper to set Admin session and clear OB session
    const setAdminSessionCookies = (res: NextResponse, emailStr: string) => {
      res.cookies.set("mcc_admin_session", emailStr, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 86400 });
      res.cookies.set("mcc_ob_session", "", { path: "/", httpOnly: true, sameSite: "lax", maxAge: 0, expires: new Date(0) });
    };

    // Helper to set OB session and clear Admin session
    const setObSessionCookies = (res: NextResponse, emailStr: string) => {
      res.cookies.set("mcc_ob_session", emailStr, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 86400 });
      res.cookies.set("mcc_admin_session", "", { path: "/", httpOnly: true, sameSite: "lax", maxAge: 0, expires: new Date(0) });
    };

    // 1. ADMIN AUTHENTICATION
    if (role === "admin") {
      try {
        await dbConnect();
        const adminDoc = await Admin.findOne({ email: cleanEmail });
        if (adminDoc && adminDoc.status === "ACTIVE") {
          // Strictly verify provided password against the database record
          if (adminDoc.passwordHash === password) {
            adminDoc.lastLoginAt = new Date();
            await adminDoc.save().catch(() => {});

            console.log(`✅ [AUTH API] Admin login verified from MongoDB for: ${cleanEmail}`);
            const res = NextResponse.json({
              message: "Admin authentication successful",
              user: { id: String(adminDoc._id), name: adminDoc.name, email: adminDoc.email, role: "ADMIN" },
            });
            setAdminSessionCookies(res, cleanEmail);
            return res;
          }
        }
      } catch (dbErr: any) {
        console.error(`❌ [AUTH API] MongoDB error during admin login:`, dbErr);
      }

      console.log(`❌ [AUTH API] Admin login failed for: ${cleanEmail}`);
      return NextResponse.json({ message: "Invalid Admin credentials" }, { status: 401 });
    }

    // 2. OFFICE BEARER AUTHENTICATION
    if (role === "office-bearer") {
      let obFound = null;

      try {
        await dbConnect();
        obFound = await OfficeBearer.findOne({ email: cleanEmail, status: "ACTIVE" }).populate("responsibilityId");
      } catch (dbErr: any) {
        console.error(`❌ [AUTH API] MongoDB connection error:`, dbErr);
      }

      if (obFound && obFound.passwordHash === password) {
        obFound.lastLoginAt = new Date();
        await obFound.save().catch(() => {});

        console.log(`✅ [AUTH API] Office Bearer verified from MongoDB for: ${cleanEmail}`);
        const res = NextResponse.json({
          message: "Office Bearer authentication successful",
          user: {
            id: String(obFound._id),
            name: obFound.name,
            email: obFound.email,
            department: obFound.department || "Computer Science",
            responsibility: obFound.responsibilityId ? (obFound.responsibilityId as any).name : "Unassigned",
            role: "OFFICE_BEARER",
          },
        });
        setObSessionCookies(res, cleanEmail);
        return res;
      }

      console.log(`❌ [AUTH API] Office Bearer login REJECTED (invalid credentials or inactive) for: ${cleanEmail}`);
      return NextResponse.json(
        { message: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    return NextResponse.json({ message: "Invalid role specified." }, { status: 400 });
  } catch (error) {
    console.error("❌ [AUTH API ERROR]:", error);
    return NextResponse.json({ message: "Internal server error during login." }, { status: 500 });
  }
}
