import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { SystemSetting, ProposalModel, TestAttempt } from "@/lib/db/models";

// POST /api/students-corner/validate-event
// Body: { activityName: "Placement Questions" | "General Quiz" | "Technical Games", email?: string }
// Validates whether the event is currently OPEN in MongoDB and checks if the student (by normalized email) has already attempted it.
// Enforces server-side timeline verification (startAt, endAt) for General Quiz and Placement Questions.
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { activityName, email } = body;

    if (!activityName) {
      return NextResponse.json({ message: "activityName is required." }, { status: 400 });
    }

    const now = new Date();

    // 1. Email Domain Validation if email is provided
    let studentEmailNormalized: string | null = null;
    if (email && typeof email === "string" && email.trim()) {
      const trimmed = email.trim().toLowerCase();
      const parts = trimmed.split("@");
      if (parts.length !== 2 || !parts[0] || `@${parts[1]}` !== "@mepcoeng.ac.in") {
        return NextResponse.json(
          {
            allowed: false,
            message: "Please use your Mepco college email address ending with @mepcoeng.ac.in.",
          },
          { status: 400 }
        );
      }
      studentEmailNormalized = trimmed;
    }

    // 2. Check timeline and duplicate attempt on active approved proposal for General Quiz & Placement Questions
    if (activityName === "General Quiz" || activityName === "Placement Questions") {
      const dbType = activityName === "General Quiz" ? "GENERAL_QUIZ" : "PLACEMENT_QUESTIONS";
      const activeProposal = await ProposalModel.findOne({
        type: dbType,
        status: "APPROVED",
        isActive: true,
      }).sort({ submittedAt: -1 });

      const logicalActivityId = activeProposal
        ? String(activeProposal.parentId || activeProposal._id)
        : (activityName === "Placement Questions" ? "default-placement" : "default-general-quiz");

      if (activeProposal) {
        // Timeline check
        if (activeProposal.startAt && activeProposal.endAt) {
          const startAt = new Date(activeProposal.startAt);
          const endAt = new Date(activeProposal.endAt);

          if (now < startAt) {
            return NextResponse.json(
              {
                allowed: false,
                status: "UPCOMING",
                message: `"${activityName}" has not started yet. (Starts at: ${startAt.toLocaleString()})`,
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
              },
              { status: 403 }
            );
          }

          if (now > endAt) {
            return NextResponse.json(
              {
                allowed: false,
                status: "CLOSED",
                message: `"${activityName}" has ended. (Closed at: ${endAt.toLocaleString()})`,
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
              },
              { status: 403 }
            );
          }
        }
      }

      // Duplicate attempt check if email is provided
      if (studentEmailNormalized) {
        const existingAttempt = await TestAttempt.findOne({
          studentEmailNormalized,
          activityId: logicalActivityId,
          status: { $in: ["COMPLETED", "SUBMITTED"] },
        });

        if (existingAttempt) {
          return NextResponse.json(
            {
              allowed: false,
              code: "ALREADY_ATTEMPTED",
              message: "You have already attempted this test. Only one attempt is allowed per student.",
              activityId: logicalActivityId,
            },
            { status: 409 }
          );
        }
      }

      // If active proposal exists, return its details
      if (activeProposal) {
        return NextResponse.json({
          allowed: true,
          status: "OPEN",
          activityId: logicalActivityId,
          startAt: activeProposal.startAt ? new Date(activeProposal.startAt).toISOString() : null,
          endAt: activeProposal.endAt ? new Date(activeProposal.endAt).toISOString() : null,
        });
      }
    }

    // 2. Base SystemSetting check for other activities or unconfigured timeline
    const setting = await SystemSetting.findOne({ key: "activityAvailability" });
    const availabilityMap: Record<string, string> = setting?.value || {
      "Placement Questions": "OPEN",
      "General Quiz": "OPEN",
      "Technical Games": "COMING SOON",
    };

    const currentStatus = availabilityMap[activityName] || "OPEN";

    if (currentStatus === "CLOSED") {
      return NextResponse.json(
        {
          allowed: false,
          status: "CLOSED",
          message: `"${activityName}" is currently closed by the administrator. Access is not permitted.`,
        },
        { status: 403 }
      );
    }

    if (currentStatus === "COMING SOON" || currentStatus === "UPCOMING") {
      return NextResponse.json(
        {
          allowed: false,
          status: currentStatus,
          message: `"${activityName}" is not currently active.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ allowed: true, status: "OPEN" });
  } catch (error: any) {
    console.error("❌ [API /validate-event] Error:", error);
    return NextResponse.json(
      { message: "Failed to validate activity availability.", error: error.message },
      { status: 500 }
    );
  }
}
