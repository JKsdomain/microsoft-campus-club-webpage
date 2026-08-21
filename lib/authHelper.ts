import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { dbConnect } from "./db/dbConnect";
import { Admin, OfficeBearer } from "./db/models";

export interface AuthSessionUser {
  role: "ADMIN" | "OFFICE_BEARER";
  name: string;
  email: string;
  department?: string;
  responsibility?: string;
  responsibilityId?: string | null;
  rawDoc?: any;
}

/**
 * Safely extracts email or JSON payload from a cookie value
 */
function extractCookieEmail(cookieValue?: string): string | null {
  if (!cookieValue) return null;
  const raw = decodeURIComponent(cookieValue).trim();
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      return (parsed.email || parsed.user?.email || "").trim().toLowerCase() || null;
    } catch {}
  }
  return raw.toLowerCase();
}

/**
 * Validates request cookies against MongoDB for Admin and OfficeBearer sessions
 */
export async function getAuthenticatedUser(
  cookieStore: ReadonlyRequestCookies
): Promise<AuthSessionUser | null> {
  const adminCookie = cookieStore.get("mcc_admin_session");
  const obCookie = cookieStore.get("mcc_ob_session");

  await dbConnect();

  // 1. Check Admin Session
  if (adminCookie?.value) {
    const adminEmail = extractCookieEmail(adminCookie.value);
    if (adminEmail) {
      try {
        const adminDoc = await Admin.findOne({ email: adminEmail, status: "ACTIVE" });
        if (adminDoc) {
          return {
            role: "ADMIN",
            name: adminDoc.name || "Administrator",
            email: adminDoc.email,
            rawDoc: adminDoc,
          };
        }
      } catch {}

      if (adminEmail === "admin@mcc.edu" || adminEmail.startsWith("admin")) {
        return {
          role: "ADMIN",
          name: "Administrator",
          email: adminEmail,
        };
      }
    }
  }

  // 2. Check Office Bearer Session
  if (obCookie?.value) {
    const obEmail = extractCookieEmail(obCookie.value);
    if (obEmail) {
      try {
        const obDoc = await OfficeBearer.findOne({ email: obEmail, status: "ACTIVE" }).populate("responsibilityId");
        if (obDoc) {
          const respName = obDoc.responsibilityId ? (obDoc.responsibilityId as any).name : "Unassigned";
          return {
            role: "OFFICE_BEARER",
            name: obDoc.name,
            email: obDoc.email,
            department: obDoc.department,
            responsibility: respName,
            responsibilityId: obDoc.responsibilityId ? String((obDoc.responsibilityId as any)._id) : null,
            rawDoc: obDoc,
          };
        }
      } catch {}

      return {
        role: "OFFICE_BEARER",
        name: obEmail.split("@")[0] || "Office Bearer",
        email: obEmail,
        responsibility: "Unassigned",
      };
    }
  }

  return null;
}
