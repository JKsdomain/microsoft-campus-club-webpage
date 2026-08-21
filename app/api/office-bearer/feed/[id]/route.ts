import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { ProposalModel, OfficeBearer, AuditLog } from "@/lib/db/models";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { getAuthenticatedUser } from "@/lib/authHelper";

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
    const authUser = await getAuthenticatedUser(cookieStore);

    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in to manage feed posts." },
        { status: 401 }
      );
    }

    const isAdmin = authUser.role === "ADMIN";
    const actorName = authUser.name || (isAdmin ? "Admin" : "Office Bearer");
    const actorEmail = authUser.email || "";

    // 3. Find the Feed Post Proposal in MongoDB
    const proposal = await ProposalModel.findById(id);
    if (!proposal) {
      return NextResponse.json(
        { message: "Feed post not found." },
        { status: 404 }
      );
    }

    // 4. Enforce Authorization
    let isAuthorized = isAdmin;
    if (!isAuthorized && authUser.role === "OFFICE_BEARER") {
      const respName = (authUser.responsibility || "").toLowerCase();
      const isFeedLead = respName.includes("feed");
      const isAuthor =
        proposal.submittedBy === authUser.name ||
        (proposal as any).authorEmail === authUser.email;

      if (isFeedLead || isAuthor) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
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
