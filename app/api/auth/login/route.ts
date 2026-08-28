import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { OfficeBearer, Admin, Responsibility } from "@/lib/db/models";

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
    const cleanPassword = String(password).trim();
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
        // Ensure Responsibility model is registered for populate references
        void Responsibility;

        const adminDoc = await Admin.findOne({
          email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
        });

        if (adminDoc) {
          if (adminDoc.status && adminDoc.status.toUpperCase() === "INACTIVE") {
            return NextResponse.json(
              { message: "Your Administrator account is currently inactive. Please contact the system administrator." },
              { status: 403 }
            );
          }

          // Strictly verify provided password against the database record
          const isAdminPasswordMatch =
            adminDoc.passwordHash === password ||
            String(adminDoc.passwordHash).trim() === cleanPassword ||
            adminDoc.passwordHash === cleanPassword;

          if (isAdminPasswordMatch) {
            adminDoc.lastLoginAt = new Date();
            await adminDoc.save().catch(() => {});

            console.log(`✅ [AUTH API] Admin login verified from MongoDB for: ${cleanEmail}`);
            const res = NextResponse.json({
              message: "Admin authentication successful",
              user: { id: String(adminDoc._id), name: adminDoc.name, email: adminDoc.email, role: "ADMIN" },
            });
            setAdminSessionCookies(res, adminDoc.email || cleanEmail);
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
        // Ensure Responsibility model is registered
        void Responsibility;

        // Find Office Bearer by case-insensitive email
        obFound = await OfficeBearer.findOne({
          email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
        }).populate("responsibilityId");
      } catch (dbErr: any) {
        console.error(`❌ [AUTH API] MongoDB connection error:`, dbErr);
      }

      if (obFound) {
        // Check inactive status (case-insensitive)
        if (obFound.status && obFound.status.toUpperCase() === "INACTIVE") {
          console.log(`⚠️ [AUTH API] Inactive Office Bearer attempted login: ${cleanEmail}`);
          return NextResponse.json(
            { message: "Your Office Bearer account is currently inactive. Please contact an Administrator." },
            { status: 403 }
          );
        }

        // Compare password safely
        const isPasswordMatch =
          obFound.passwordHash === password ||
          String(obFound.passwordHash).trim() === cleanPassword ||
          obFound.passwordHash === cleanPassword;

        if (isPasswordMatch) {
          obFound.lastLoginAt = new Date();
          await obFound.save().catch(() => {});

          const respName =
            obFound.responsibilityId && typeof obFound.responsibilityId === "object"
              ? (obFound.responsibilityId as any).name || "Unassigned"
              : "Unassigned";

          console.log(`✅ [AUTH API] Office Bearer verified from MongoDB for: ${obFound.email}`);
          const res = NextResponse.json({
            message: "Office Bearer authentication successful",
            user: {
              id: String(obFound._id),
              name: obFound.name,
              email: obFound.email,
              department: obFound.department || "Computer Science & Engineering",
              responsibility: respName,
              role: "OFFICE_BEARER",
            },
          });
          setObSessionCookies(res, obFound.email || cleanEmail);
          return res;
        }
      }

      console.log(`❌ [AUTH API] Office Bearer login REJECTED (invalid credentials or user not found) for: ${cleanEmail}`);
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
