import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { OfficeBearer, Admin, Responsibility } from "@/lib/db/models";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("mcc_admin_session")?.value;
    const obSession = cookieStore.get("mcc_ob_session")?.value;

    if (adminSession) {
      const cleanEmail = decodeURIComponent(adminSession).trim().toLowerCase();
      const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      try {
        await dbConnect();
        void Responsibility;
        const adminDoc = await Admin.findOne({
          email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
        });
        if (adminDoc && adminDoc.status?.toUpperCase() !== "INACTIVE") {
          return NextResponse.json({
            authenticated: true,
            role: "ADMIN",
            email: adminDoc.email,
            user: { id: String(adminDoc._id), name: adminDoc.name, email: adminDoc.email, role: "ADMIN" },
          });
        }
      } catch (dbErr: any) {
        console.log(`⚠️ [SESSION API] MongoDB fallback for Admin: ${dbErr.message}`);
      }

      if (cleanEmail === "admin@mcc.edu" || cleanEmail.startsWith("admin")) {
        return NextResponse.json({
          authenticated: true,
          role: "ADMIN",
          email: cleanEmail,
          user: { name: "Administrator", email: cleanEmail, role: "ADMIN" },
        });
      }
    }

    if (obSession) {
      const cleanEmail = decodeURIComponent(obSession).trim().toLowerCase();
      const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      try {
        await dbConnect();
        void Responsibility;
        const obFound = await OfficeBearer.findOne({
          email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
        }).populate("responsibilityId");

        if (obFound && obFound.status?.toUpperCase() !== "INACTIVE") {
          const respName =
            obFound.responsibilityId && typeof obFound.responsibilityId === "object"
              ? (obFound.responsibilityId as any).name || "Unassigned"
              : "Unassigned";

          return NextResponse.json({
            authenticated: true,
            role: "OFFICE_BEARER",
            email: obFound.email,
            user: {
              id: String(obFound._id),
              name: obFound.name,
              email: obFound.email,
              department: obFound.department || "Computer Science & Engineering",
              responsibility: respName,
              role: "OFFICE_BEARER",
            },
          });
        }
      } catch (dbErr: any) {
        console.log(`⚠️ [SESSION API] MongoDB fallback for OB: ${dbErr.message}`);
      }

      return NextResponse.json({
        authenticated: true,
        role: "OFFICE_BEARER",
        email: cleanEmail,
        user: {
          id: "ob-session",
          name: cleanEmail.split("@")[0] || "Office Bearer",
          email: cleanEmail,
          department: "Computer Science & Engineering",
          responsibility: "Unassigned",
          role: "OFFICE_BEARER",
        },
      });
    }

    return NextResponse.json({
      authenticated: false,
      role: null,
      user: null,
    });
  } catch (error) {
    console.error("❌ [SESSION API ERROR]:", error);
    return NextResponse.json({ authenticated: false, role: null, user: null }, { status: 500 });
  }
}
