import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { AuditLog } from "@/lib/db/models";

// GET /api/admin/audit-logs - Fetch activity logs from MongoDB Atlas
export async function GET() {
  try {
    await dbConnect();
    const logs = await AuditLog.find().sort({ timestamp: -1, createdAt: -1 }).limit(100);

    const formatted = logs.map((log: any) => ({
      id: String(log._id),
      timestamp: log.timestamp ? new Date(log.timestamp).toISOString().replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
      action: log.action,
      module: log.module,
      status: "Success" as const,
      user: log.actorType || "ADMIN",
    }));

    return NextResponse.json({ auditLogs: formatted });
  } catch (error: any) {
    console.error("❌ [API GET /audit-logs] Error fetching audit logs:", error);
    return NextResponse.json({ message: "Failed to fetch audit logs.", error: error.message }, { status: 500 });
  }
}
