import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { AuditLog } from "@/lib/db/models";

// GET /api/admin/audit-logs - Fetch activity logs from MongoDB Atlas
export async function GET() {
  try {
    await dbConnect();
    const logs = await AuditLog.find().sort({ timestamp: -1, createdAt: -1 }).limit(100);

    const formatted = logs.map((log: any) => {
      const actor =
        log.actorName ||
        log.metadata?.deletedBy ||
        log.metadata?.archivedBy ||
        log.metadata?.actorEmail ||
        (log.actorId ? String(log.actorId) : null) ||
        (log.actorType === "OFFICE_BEARER" ? "Office Bearer" : "Administrator");

      const role =
        log.role ||
        (log.actorType === "OFFICE_BEARER"
          ? "Office Bearer"
          : log.actorType === "STUDENT"
          ? "Student"
          : "Administrator");

      return {
        id: String(log._id),
        timestamp: log.timestamp
          ? new Date(log.timestamp).toISOString().replace("T", " ").substring(0, 19)
          : new Date().toISOString().replace("T", " ").substring(0, 19),
        actor,
        actorEmail: log.actorEmail || log.metadata?.actorEmail || undefined,
        role,
        action: log.action,
        module: log.module,
        status: "Success" as const,
        targetId: log.targetId ? String(log.targetId) : null,
        targetType: log.targetType || log.metadata?.targetType || null,
        originalValue: log.originalValue ?? log.metadata?.originalValue ?? null,
        modifiedValue: log.modifiedValue ?? log.metadata?.modifiedValue ?? null,
        reason: log.reason || log.metadata?.reason || log.metadata?.rejectionReason || null,
        metadata: log.metadata || {},
      };
    });

    return NextResponse.json({ auditLogs: formatted });
  } catch (error: any) {
    console.error("❌ [API GET /audit-logs] Error fetching audit logs:", error);
    return NextResponse.json({ message: "Failed to fetch audit logs.", error: error.message }, { status: 500 });
  }
}
