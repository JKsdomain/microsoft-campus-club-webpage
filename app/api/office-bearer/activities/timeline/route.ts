import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { ProposalModel, OfficeBearer, AuditLog } from "@/lib/db/models";

// PATCH & PUT /api/office-bearer/activities/timeline
// Allows the responsible OB to update/extend ONLY the timeline (startAt, endAt)
// of an already-approved/published General Quiz or Placement Questions activity
// WITHOUT requiring Admin re-approval and WITHOUT creating a content revision.
export async function PATCH(req: Request) {
  return handleTimelineUpdate(req);
}

export async function PUT(req: Request) {
  return handleTimelineUpdate(req);
}

async function handleTimelineUpdate(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { activityId, startAt, endAt } = body;

    if (!activityId) {
      return NextResponse.json(
        { message: "activityId is required." },
        { status: 400 }
      );
    }

    if (!endAt) {
      return NextResponse.json(
        { message: "endAt (End Date & Time) is required." },
        { status: 400 }
      );
    }

    // 1. Authenticate Office Bearer session
    const cookieStore = await cookies();
    const obSession = cookieStore.get("mcc_ob_session")?.value;
    const adminSession = cookieStore.get("mcc_admin_session")?.value;

    let actorName = "Office Bearer";
    let actorEmail = "";
    let obResponsibility = "";

    if (obSession) {
      actorEmail = decodeURIComponent(obSession).trim().toLowerCase();
      try {
        const obDoc = await OfficeBearer.findOne({ email: actorEmail, status: "ACTIVE" }).populate("responsibilityId");
        if (obDoc) {
          actorName = obDoc.name;
          obResponsibility = obDoc.responsibilityId ? (obDoc.responsibilityId as any).name : "";
        }
      } catch (dbErr: any) {
        console.warn("⚠️ [TIMELINE API] Failed to fetch OB doc:", dbErr.message);
      }
    } else if (adminSession) {
      // Allow administrator override/testing
      actorName = "Administrator";
      actorEmail = decodeURIComponent(adminSession).trim().toLowerCase();
      obResponsibility = "ADMIN";
    } else {
      return NextResponse.json(
        { message: "Authentication required. Please log in as an Office Bearer." },
        { status: 401 }
      );
    }

    // 2. Fetch the target activity from MongoDB
    const proposal = await ProposalModel.findById(activityId);
    if (!proposal) {
      return NextResponse.json(
        { message: "Activity proposal not found in MongoDB." },
        { status: 404 }
      );
    }

    // 3. Strict Scope Enforcement: ONLY General Quiz and Placement Questions
    if (proposal.type !== "GENERAL_QUIZ" && proposal.type !== "PLACEMENT_QUESTIONS") {
      return NextResponse.json(
        { message: "Timeline updates are permitted ONLY for General Quiz and Placement Questions." },
        { status: 400 }
      );
    }

    // 4. Activity must be currently APPROVED / PUBLISHED
    if (proposal.status !== "APPROVED") {
      return NextResponse.json(
        { message: "Timeline updates can only be applied to currently approved and published activities." },
        { status: 400 }
      );
    }

    // 5. Responsibility check (OB must be assigned to this activity type)
    if (obResponsibility !== "ADMIN") {
      const typeToResponsibility: Record<string, string> = {
        GENERAL_QUIZ: "General Quiz",
        PLACEMENT_QUESTIONS: "Placement Questions",
      };
      const requiredResponsibility = typeToResponsibility[proposal.type];
      if (obResponsibility && obResponsibility !== requiredResponsibility) {
        return NextResponse.json(
          { message: `Unauthorized: You are assigned to "${obResponsibility}" and cannot modify "${requiredResponsibility}".` },
          { status: 403 }
        );
      }
    }

    // 6. Validate timeline
    const previousStartAt = proposal.startAt ? new Date(proposal.startAt) : null;
    const previousEndAt = proposal.endAt ? new Date(proposal.endAt) : null;

    const newStartAt = startAt ? new Date(startAt) : (previousStartAt || new Date());
    const newEndAt = new Date(endAt);

    if (isNaN(newStartAt.getTime()) || isNaN(newEndAt.getTime())) {
      return NextResponse.json(
        { message: "Invalid date format for Start or End date/time." },
        { status: 400 }
      );
    }

    if (newEndAt.getTime() <= newStartAt.getTime()) {
      return NextResponse.json(
        { message: "Invalid timeline: End date/time must be strictly after Start date/time." },
        { status: 400 }
      );
    }

    // 7. Update ONLY timeline fields (Do NOT touch questions, content, status, revision fields)
    proposal.startAt = newStartAt;
    proposal.endAt = newEndAt;
    await proposal.save();

    // 8. Create AuditLog entry
    const activityDisplayName = proposal.type === "GENERAL_QUIZ" ? "General Quiz" : "Placement Questions";

    await AuditLog.create({
      actorType: obResponsibility === "ADMIN" ? "ADMIN" : "OFFICE_BEARER",
      actorName,
      actorEmail,
      role: obResponsibility === "ADMIN" ? "Administrator" : "Office Bearer",
      action: "ACTIVITY_TIMELINE_UPDATED",
      module: activityDisplayName,
      targetId: proposal._id,
      targetType: proposal.type,
      originalValue: {
        startAt: previousStartAt ? previousStartAt.toISOString() : null,
        endAt: previousEndAt ? previousEndAt.toISOString() : null,
      },
      modifiedValue: {
        startAt: newStartAt.toISOString(),
        endAt: newEndAt.toISOString(),
      },
      metadata: {
        activityId: String(proposal._id),
        activityType: proposal.type,
        actorName,
        actorEmail,
        newEndAt: newEndAt.toISOString(),
      },
    });

    console.log(`✅ [MONGODB ATLAS] ${activityDisplayName} timeline updated by ${actorName}: ${proposal._id}`);

    return NextResponse.json({
      message: "Activity deadline updated successfully in MongoDB.",
      activityId: String(proposal._id),
      startAt: newStartAt.toISOString(),
      endAt: newEndAt.toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [API /office-bearer/activities/timeline] Error:", error);
    return NextResponse.json(
      { message: "Failed to update activity timeline.", error: error.message },
      { status: 500 }
    );
  }
}
