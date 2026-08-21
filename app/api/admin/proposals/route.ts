import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { ProposalModel, OfficeBearer, AuditLog } from "@/lib/db/models";
import { getAuthenticatedUser } from "@/lib/authHelper";
import mongoose from "mongoose";

// GET /api/admin/proposals
// Returns all proposals from MongoDB, formatted for AdminAuthProvider and OBAuthProvider
export async function GET() {
  try {
    await dbConnect();

    const proposals = await ProposalModel.find().sort({ submittedAt: -1 });

    const formatted = proposals.map((p: any) => {
      // Map DB type enum back to UI display names
      const typeMap: Record<string, string> = {
        GENERAL_QUIZ: "General Quiz",
        PLACEMENT_QUESTIONS: "Placement Questions",
        FEED: "Feed Community",
        TECHNICAL_GAMES: "Technical Games",
      };
      // Map DB status enum back to UI display names
      const statusMap: Record<string, string> = {
        PENDING: "Pending",
        APPROVED: "Approved",
        REJECTED: "Rejected",
        DRAFT: "Pending",
        PENDING_REAPPROVAL: "Pending Re-Approval",
        ARCHIVED: "Archived",
      };

      return {
        id: String(p._id),
        type: typeMap[p.type] || p.type,
        title: p.title || `${typeMap[p.type] || p.type} Submission`,
        submittedBy: p.submittedBy,
        authorDepartment: p.authorDepartment || "Computer Science & Engineering",
        submittedDate: p.submittedAt
          ? new Date(p.submittedAt).toISOString().replace("T", " ").substring(0, 16)
          : new Date().toISOString().replace("T", " ").substring(0, 16),
        status: statusMap[p.status] || p.status,
        details: p.details || "",
        questions: Array.isArray(p.questions) ? p.questions : [],
        // Quiz-specific metadata
        questionsToUpload: p.questionsToUpload,
        questionsToDisplay: p.questionsToDisplay,
        randomQuestions: p.randomQuestions,
        randomChoices: p.randomChoices,
        timerMinutes: p.timerMinutes,
        questionsDetected: p.questionsDetected,
        csvFileName: p.csvFileName,
        // Feed-specific metadata
        mediaType: p.mediaType || "none",
        mediaUrl: p.mediaUrl || null,
        mediaPublicId: p.mediaPublicId || "",
        likesCount: p.likesCount || 0,
        dislikesCount: p.dislikesCount || 0,
        // Revision metadata
        revisionNumber: p.revisionNumber || 0,
        parentId: p.parentId ? String(p.parentId) : null,
        isActive: p.isActive !== undefined ? p.isActive : true,
        revisionComment: p.revisionComment || "",
        isRevision: (p.revisionNumber || 0) > 0,
        // Timeline metadata (General Quiz & Placement Questions)
        startAt: p.startAt ? new Date(p.startAt).toISOString() : null,
        endAt: p.endAt ? new Date(p.endAt).toISOString() : null,
      };
    });

    return NextResponse.json({ proposals: formatted });
  } catch (error: any) {
    console.error("❌ [API GET /proposals] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch proposals.", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/proposals
// OB submits a new proposal (Quiz, Placement, Feed Community, or Technical Games).
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      type,
      title,
      submittedBy,
      authorDepartment,
      content,
      details,
      questions,
      questionsToUpload,
      questionsToDisplay,
      randomQuestions,
      randomChoices,
      timerMinutes,
      questionsDetected,
      csvFileName,
      mediaType,
      mediaUrl,
      mediaPublicId,
      startAt,
      endAt,
    } = body;

    if (!type || !submittedBy) {
      return NextResponse.json(
        { message: "type and submittedBy are required." },
        { status: 400 }
      );
    }

    // Map UI type names to DB enum
    const typeMap: Record<string, string> = {
      "General Quiz": "GENERAL_QUIZ",
      "Placement Questions": "PLACEMENT_QUESTIONS",
      "Feed Community": "FEED",
      "Technical Games": "TECHNICAL_GAMES",
    };

    const dbType = typeMap[type] || type;

    // Timeline validation for General Quiz & Placement Questions
    let parsedStartAt: Date | null = null;
    let parsedEndAt: Date | null = null;
    if (dbType === "GENERAL_QUIZ" || dbType === "PLACEMENT_QUESTIONS") {
      if (startAt && endAt) {
        parsedStartAt = new Date(startAt);
        parsedEndAt = new Date(endAt);
        if (isNaN(parsedStartAt.getTime()) || isNaN(parsedEndAt.getTime())) {
          return NextResponse.json(
            { message: "Invalid date format for Start or End date/time." },
            { status: 400 }
          );
        }
        if (parsedEndAt.getTime() <= parsedStartAt.getTime()) {
          return NextResponse.json(
            { message: "End date/time must be strictly after Start date/time." },
            { status: 400 }
          );
        }
      }
    }

    const finalDetails = details || content || "";
    const generatedTitle =
      title ||
      (dbType === "FEED"
        ? finalDetails.length > 50
          ? `${finalDetails.substring(0, 47)}...`
          : finalDetails || "Community Feed Update"
        : `${type} Submission`);

    const proposal = await ProposalModel.create({
      type: dbType,
      title: generatedTitle,
      referenceId: new mongoose.Types.ObjectId(),
      submittedBy,
      authorDepartment: authorDepartment || "Computer Science & Engineering",
      status: "PENDING",
      submittedAt: new Date(),
      // Quiz-specific metadata
      questionsToUpload,
      questionsToDisplay,
      randomQuestions,
      randomChoices,
      timerMinutes,
      questionsDetected,
      csvFileName,
      details: finalDetails,
      questions: Array.isArray(questions) ? questions : [],
      // Feed-specific metadata
      mediaType: mediaType || "none",
      mediaUrl: mediaUrl || null,
      mediaPublicId: mediaPublicId || "",
      likesCount: 0,
      dislikesCount: 0,
      // Timeline fields
      startAt: parsedStartAt,
      endAt: parsedEndAt,
    });

    // Audit log
    await AuditLog.create({
      actorType: "OFFICE_BEARER",
      actorName: submittedBy,
      role: "Office Bearer",
      action: "PROPOSAL_SUBMITTED",
      module: "Approval Workflow",
      targetId: proposal._id,
      targetType: proposal.type,
      originalValue: null,
      modifiedValue: {
        title: generatedTitle,
        type: dbType,
        submittedBy,
        authorDepartment,
        timerMinutes: proposal.timerMinutes,
        questionsCount: proposal.questionsDetected || (Array.isArray(questions) ? questions.length : 0),
      },
      metadata: { submittedBy, type: dbType },
    });

    console.log(`✅ [MONGODB ATLAS] Proposal created: ${proposal._id} (${dbType}) by ${submittedBy}`);

    const uiTypeMap: Record<string, string> = {
      GENERAL_QUIZ: "General Quiz",
      PLACEMENT_QUESTIONS: "Placement Questions",
      FEED: "Feed Community",
      TECHNICAL_GAMES: "Technical Games",
    };

    const formatted = {
      id: String(proposal._id),
      type: uiTypeMap[proposal.type] || proposal.type,
      title: proposal.title,
      submittedBy: proposal.submittedBy,
      authorDepartment: proposal.authorDepartment,
      submittedDate: new Date(proposal.submittedAt).toISOString().replace("T", " ").substring(0, 16),
      status: "Pending Approval",
      details: proposal.details,
      questions: proposal.questions || [],
      questionsToUpload: proposal.questionsToUpload,
      questionsToDisplay: proposal.questionsToDisplay,
      randomQuestions: proposal.randomQuestions,
      randomChoices: proposal.randomChoices,
      timerMinutes: proposal.timerMinutes,
      questionsDetected: proposal.questionsDetected,
      csvFileName: proposal.csvFileName,
      mediaType: proposal.mediaType,
      mediaUrl: proposal.mediaUrl,
      mediaPublicId: proposal.mediaPublicId,
      likesCount: 0,
      dislikesCount: 0,
      startAt: proposal.startAt ? new Date(proposal.startAt).toISOString() : null,
      endAt: proposal.endAt ? new Date(proposal.endAt).toISOString() : null,
    };

    return NextResponse.json({ message: "Proposal submitted.", proposal: formatted }, { status: 201 });
  } catch (error: any) {
    console.error("❌ [API POST /proposals] Error:", error);
    return NextResponse.json(
      { message: "Failed to submit proposal.", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/proposals
// Admin approves, rejects, votes, archives, or OB creates a revision of a proposal.
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, action, rejectionReason, vote, currentVote, revisionComment, changes } = body;

    if (!id || !action) {
      return NextResponse.json(
        { message: "id and action are required." },
        { status: 400 }
      );
    }

    const proposal = await ProposalModel.findById(id);
    if (!proposal) {
      return NextResponse.json(
        { message: "Proposal not found." },
        { status: 404 }
      );
    }

    // ----- REVISION CREATION (OB edits a published/approved activity) -----
    if (action === "revise") {
      if (proposal.status !== "APPROVED") {
        return NextResponse.json({ message: "Only approved/published proposals can be revised." }, { status: 400 });
      }

      // Prevent multiple pending revisions for the same parent
      const existingPendingRevision = await ProposalModel.findOne({
        parentId: proposal._id,
        status: "PENDING_REAPPROVAL",
      });
      if (existingPendingRevision) {
        return NextResponse.json({
          message: "A pending revision already exists for this activity. Wait for admin review before submitting another.",
        }, { status: 409 });
      }

      // Create new revision document — clone the parent and overlay changes
      const parentObj = proposal.toObject();
      delete parentObj._id;
      delete parentObj.__v;
      delete parentObj.createdAt;
      delete parentObj.updatedAt;

      const newRevision = new ProposalModel({
        ...parentObj,
        ...changes,
        status: "PENDING_REAPPROVAL",
        revisionNumber: (proposal.revisionNumber || 0) + 1,
        parentId: proposal._id,
        revisionComment: revisionComment || "",
        isActive: false, // NOT active until admin approves
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
      });
      await newRevision.save();

      await AuditLog.create({
        actorType: "OFFICE_BEARER",
        actorName: proposal.submittedBy,
        role: "Office Bearer",
        action: "PROPOSAL_REVISED",
        module: "Approval Workflow",
        targetId: newRevision._id,
        targetType: proposal.type,
        originalValue: {
          revisionNumber: proposal.revisionNumber || 0,
          title: proposal.title,
          status: proposal.status,
        },
        modifiedValue: {
          revisionNumber: newRevision.revisionNumber,
          title: newRevision.title,
          status: "PENDING_REAPPROVAL",
          changes,
        },
        metadata: { parentId: String(proposal._id), revisionNumber: newRevision.revisionNumber, revisionComment },
      });

      console.log(`✅ [MONGODB ATLAS] Revision #${newRevision.revisionNumber} created for proposal ${proposal._id}`);

      return NextResponse.json({
        message: "Revision created and submitted for re-approval.",
        revisionId: String(newRevision._id),
        revisionNumber: newRevision.revisionNumber,
      }, { status: 201 });
    }

    // ----- ARCHIVE PLACEMENT QUIZ OR PROPOSAL (Issue 16 & 1) -----
    if (action === "archive") {
      const cookieStore = await cookies();
      const authUser = await getAuthenticatedUser(cookieStore);

      if (!authUser) {
        return NextResponse.json(
          { message: "Unauthorized. Please log in to archive activities." },
          { status: 401 }
        );
      }

      const isAdmin = authUser.role === "ADMIN";
      let isAuthorized = isAdmin;

      if (!isAuthorized && authUser.role === "OFFICE_BEARER") {
        const respName = authUser.responsibility || "";
        const isPlacementLead = respName.toLowerCase().includes("placement");
        const isAuthor =
          proposal.submittedBy === authUser.name ||
          (proposal as any).authorEmail === authUser.email;

        if (proposal.type === "PLACEMENT_QUESTIONS" && (isPlacementLead || isAuthor)) {
          isAuthorized = true;
        } else if (isAuthor) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { message: "Forbidden. You are not authorized to archive this activity." },
          { status: 403 }
        );
      }

      const actorName = authUser.name || (isAdmin ? "Administrator" : "Office Bearer");
      const actorEmail = authUser.email || "";

      const previousStatus = proposal.status;
      proposal.status = "ARCHIVED";
      proposal.isActive = false;
      proposal.archivedAt = new Date();
      await proposal.save();

      await AuditLog.create({
        actorType: isAdmin ? "ADMIN" : "OFFICE_BEARER",
        actorName,
        actorEmail,
        role: isAdmin ? "Administrator" : "Office Bearer",
        action:
          proposal.type === "PLACEMENT_QUESTIONS"
            ? "PLACEMENT_QUIZ_ARCHIVED"
            : "PROPOSAL_ARCHIVED",
        module:
          proposal.type === "PLACEMENT_QUESTIONS"
            ? "Placement Questions"
            : "Approval Workflow",
        targetId: proposal._id,
        targetType: proposal.type,
        originalValue: { status: previousStatus, isActive: true },
        modifiedValue: { status: "ARCHIVED", isActive: false, archivedAt: proposal.archivedAt },
        metadata: {
          title: proposal.title,
          previousStatus,
          newStatus: "ARCHIVED",
          archivedBy: actorName,
        },
      });

      console.log(`✅ [MONGODB ATLAS] Proposal ${id} archived by ${actorName}`);
      return NextResponse.json({
        message: "Activity successfully archived.",
        proposal: { id: String(proposal._id), status: "Archived" },
      });
    }

    // ----- APPROVAL -----
    if (action === "approve") {
      const isRevision = proposal.status === "PENDING_REAPPROVAL" && proposal.parentId;

      if (isRevision) {
        // --- REVISION APPROVAL: Archive old, publish new ---
        const parentProposal = await ProposalModel.findById(proposal.parentId);

        if (!parentProposal) {
          return NextResponse.json({ message: "Parent proposal not found for this revision." }, { status: 404 });
        }

        // Archive the old published version
        const oldParentStatus = parentProposal.status;
        parentProposal.status = "ARCHIVED";
        parentProposal.isActive = false;
        parentProposal.archivedAt = new Date();
        await parentProposal.save();

        // Publish the new revision
        const oldRevStatus = proposal.status;
        proposal.status = "APPROVED";
        proposal.isActive = true;
        proposal.reviewedAt = new Date();
        await proposal.save();

        // Audit logs
        await AuditLog.create({
          actorType: "ADMIN",
          actorName: "Administrator",
          role: "Administrator",
          action: "PROPOSAL_ARCHIVED",
          module: "Approval Workflow",
          targetId: parentProposal._id,
          targetType: parentProposal.type,
          originalValue: { status: oldParentStatus, isActive: true },
          modifiedValue: { status: "ARCHIVED", isActive: false },
          metadata: { action: "archive", replacedBy: String(proposal._id), revisionNumber: proposal.revisionNumber },
        });

        await AuditLog.create({
          actorType: "ADMIN",
          actorName: "Administrator",
          role: "Administrator",
          action: "PROPOSAL_APPROVED",
          module: "Approval Workflow",
          targetId: proposal._id,
          targetType: proposal.type,
          originalValue: { status: oldRevStatus, isActive: false },
          modifiedValue: { status: "APPROVED", isActive: true },
          metadata: { action: "approve_revision", parentId: String(parentProposal._id), revisionNumber: proposal.revisionNumber },
        });

        console.log(`✅ [MONGODB ATLAS] Revision #${proposal.revisionNumber} of proposal ${proposal.parentId} approved. Old version archived.`);

        return NextResponse.json({
          message: "Revision approved. Old version archived, new version is now published.",
          proposal: {
            id: String(proposal._id),
            status: "Approved",
          },
        });
      } else {
        // --- NORMAL APPROVAL (new submission) ---
        const oldStatus = proposal.status;
        proposal.status = "APPROVED";
        proposal.reviewedAt = new Date();
        proposal.isActive = true;
        await proposal.save();

        await AuditLog.create({
          actorType: "ADMIN",
          actorName: "Administrator",
          role: "Administrator",
          action: "PROPOSAL_APPROVED",
          module: "Approval Workflow",
          targetId: proposal._id,
          targetType: proposal.type,
          originalValue: { status: oldStatus, isActive: false },
          modifiedValue: { status: "APPROVED", isActive: true },
          metadata: { action, proposalType: proposal.type },
        });

        console.log(`✅ [MONGODB ATLAS] Proposal ${id} Approved`);

        return NextResponse.json({
          message: "Proposal approved in MongoDB.",
          proposal: {
            id: String(proposal._id),
            status: "Approved",
          },
        });
      }
    } else if (action === "reject") {
      const isRevision = proposal.status === "PENDING_REAPPROVAL" && proposal.parentId;
      const oldStatus = proposal.status;

      // Set status to REJECTED — if revision, old version stays published
      proposal.status = "REJECTED";
      proposal.isActive = false;
      proposal.reviewedAt = new Date();
      if (rejectionReason) {
        proposal.rejectionReason = rejectionReason;
      }
      await proposal.save();

      await AuditLog.create({
        actorType: "ADMIN",
        actorName: "Administrator",
        role: "Administrator",
        action: "PROPOSAL_REJECTED",
        module: "Approval Workflow",
        targetId: proposal._id,
        targetType: proposal.type,
        originalValue: { status: oldStatus },
        modifiedValue: { status: "REJECTED", isActive: false },
        reason: rejectionReason || null,
        metadata: { action, proposalType: proposal.type, isRevision: !!isRevision, parentId: proposal.parentId ? String(proposal.parentId) : null },
      });

      console.log(`✅ [MONGODB ATLAS] ${isRevision ? "Revision" : "Proposal"} ${id} Rejected`);

      return NextResponse.json({
        message: isRevision
          ? "Revision rejected. The currently published version remains active."
          : "Proposal rejected in MongoDB.",
        proposal: {
          id: String(proposal._id),
          status: "Rejected",
        },
      });
    } else if (action === "vote") {
      // Toggle or change like/dislike counts
      let likes = proposal.likesCount || 0;
      let dislikes = proposal.dislikesCount || 0;

      if (currentVote === vote) {
        // Untoggle
        if (vote === "like") likes = Math.max(0, likes - 1);
        if (vote === "dislike") dislikes = Math.max(0, dislikes - 1);
      } else {
        if (currentVote === "like") likes = Math.max(0, likes - 1);
        if (currentVote === "dislike") dislikes = Math.max(0, dislikes - 1);

        if (vote === "like") likes += 1;
        if (vote === "dislike") dislikes += 1;
      }

      proposal.likesCount = likes;
      proposal.dislikesCount = dislikes;
      await proposal.save();

      return NextResponse.json({
        message: "Vote recorded.",
        likesCount: likes,
        dislikesCount: dislikes,
      });
    } else {
      return NextResponse.json(
        { message: "Invalid action. Use 'approve', 'reject', 'vote', or 'revise'." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ [API PUT /proposals] Error:", error);
    return NextResponse.json(
      { message: "Failed to update proposal.", error: error.message },
      { status: 500 }
    );
  }
}
