import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { ProposalModel, OfficeBearer, AuditLog } from "@/lib/db/models";
import { deleteFromCloudinary } from "@/lib/cloudinary";

// DELETE /api/office-bearer/feed/[id]
// Authenticates user, enforces authorization (Admin or Author OB), performs safe Cloudinary asset deletion,
// removes MongoDB documents, and logs FEED_POST_DELETED audit entry.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "Post ID is required." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const adminSessionCookie = cookieStore.get("mcc_admin_session");
    const obSessionCookie = cookieStore.get("mcc_ob_session");

    let isAdmin = false;
    let isAuthorizedOB = false;
    let actorName = "Unknown";
    let actorEmail = "";

    // 1. Verify Admin Session
    if (adminSessionCookie && adminSessionCookie.value) {
      try {
        const sessionData = JSON.parse(adminSessionCookie.value);
        if (sessionData.role === "ADMIN") {
          isAdmin = true;
          actorName = sessionData.email?.split("@")[0] || "Admin";
          actorEmail = sessionData.email || "";
        }
      } catch {
        // invalid cookie json
      }
    }

    // 2. Verify OB Session if not Admin
    let currentOB: any = null;
    if (!isAdmin && obSessionCookie && obSessionCookie.value) {
      try {
        const sessionData = JSON.parse(obSessionCookie.value);
        if (sessionData.email) {
          currentOB = await OfficeBearer.findOne({
            email: sessionData.email.toLowerCase(),
            status: "ACTIVE",
          }).populate("responsibilityId");

          if (currentOB) {
            actorName = currentOB.name;
            actorEmail = currentOB.email;
          }
        }
      } catch {
        // invalid cookie json
      }
    }

    if (!isAdmin && !currentOB) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in to manage feed posts." },
        { status: 401 }
      );
    }

    // 3. Find the Feed Post Proposal in MongoDB
    const proposal = await ProposalModel.findById(id);
    if (!proposal) {
      return NextResponse.json(
        { message: "Feed post not found." },
        { status: 404 }
      );
    }

    // 4. Enforce Authorization
    if (isAdmin) {
      isAuthorizedOB = true;
    } else if (currentOB) {
      const isAuthor =
        proposal.submittedBy === currentOB.name ||
        (proposal as any).authorEmail === currentOB.email ||
        (currentOB.responsibilityId && currentOB.responsibilityId.name === "Feed Community");

      if (isAuthor) {
        isAuthorizedOB = true;
      }
    }

    if (!isAuthorizedOB) {
      console.warn(`⛔ [UNAUTHORIZED FEED DELETE ATTEMPT] User "${actorName}" attempted to delete post "${proposal._id}" by "${proposal.submittedBy}"`);
      return NextResponse.json(
        { message: "Forbidden. You are not authorized to delete this feed post." },
        { status: 403 }
      );
    }

    // 5. Safe Cloudinary Asset Cleanup (Only if not referenced by another active proposal/revision)
    if (proposal.mediaPublicId) {
      const otherUsingMedia = await ProposalModel.findOne({
        _id: { $ne: proposal._id },
        mediaPublicId: proposal.mediaPublicId,
        status: { $in: ["PENDING", "APPROVED", "PENDING_REAPPROVAL"] },
      });

      if (!otherUsingMedia) {
        const resourceType =
          proposal.mediaType === "VIDEO" || proposal.mediaType === "video"
            ? "video"
            : "image";
        await deleteFromCloudinary(proposal.mediaPublicId, resourceType);
      } else {
        console.log(`ℹ️ [CLOUDINARY ASSET PRESERVED] Media "${proposal.mediaPublicId}" is still in use by proposal "${otherUsingMedia._id}".`);
      }
    }

    // 6. Delete Proposal & Associated Revisions from MongoDB
    await ProposalModel.deleteMany({
      $or: [{ _id: proposal._id }, { parentId: proposal._id }],
    });

    // 7. Record Audit Log Entry
    await AuditLog.create({
      actorType: isAdmin ? "ADMIN" : "OFFICE_BEARER",
      action: "FEED_POST_DELETED",
      module: "Feed Community",
      targetId: proposal._id,
      metadata: {
        title: proposal.title || (proposal.content ? proposal.content.substring(0, 60) : "Feed Post"),
        deletedBy: actorName,
        actorEmail,
        role: isAdmin ? "ADMIN" : "OFFICE_BEARER",
        mediaPublicId: proposal.mediaPublicId || null,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`🗑️ [MONGODB ATLAS] Feed post "${id}" successfully deleted by ${actorName} (${isAdmin ? "ADMIN" : "OFFICE_BEARER"}).`);

    return NextResponse.json({
      success: true,
      message: "Feed post deleted successfully.",
    });
  } catch (error: any) {
    console.error("❌ [API DELETE /api/office-bearer/feed/[id]] Error:", error);
    return NextResponse.json(
      { message: "Failed to delete feed post.", error: error.message },
      { status: 500 }
    );
  }
}
