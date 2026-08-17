import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { ProposalModel, AuditLog } from "@/lib/db/models";
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
      };
      // Map DB status enum back to UI display names
      const statusMap: Record<string, string> = {
        PENDING: "Pending",
        APPROVED: "Approved",
        REJECTED: "Rejected",
        DRAFT: "Pending",
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
// OB submits a new proposal (Quiz, Placement, or Feed Community).
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
    };

    const dbType = typeMap[type] || type;
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
      // Feed-specific metadata
      mediaType: mediaType || "none",
      mediaUrl: mediaUrl || null,
      mediaPublicId: mediaPublicId || "",
      likesCount: 0,
      dislikesCount: 0,
    });

    // Audit log
    await AuditLog.create({
      actorType: "OFFICE_BEARER",
      action: `Submitted ${type} proposal: "${generatedTitle}"`,
      module: "Approval Workflow",
      targetId: proposal._id,
      metadata: { submittedBy, type: dbType },
    });

    console.log(`✅ [MONGODB ATLAS] Proposal created: ${proposal._id} (${dbType}) by ${submittedBy}`);

    const uiTypeMap: Record<string, string> = {
      GENERAL_QUIZ: "General Quiz",
      PLACEMENT_QUESTIONS: "Placement Questions",
      FEED: "Feed Community",
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
// Admin approves or rejects a proposal, or student/OB likes/dislikes a feed post.
// Body: { id: string, action: "approve" | "reject" | "vote", rejectionReason?: string, vote?: "like" | "dislike", currentVote?: "like" | "dislike" | null }
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, action, rejectionReason, vote, currentVote } = body;

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

    if (action === "approve") {
      proposal.status = "APPROVED";
      proposal.reviewedAt = new Date();
      await proposal.save();

      await AuditLog.create({
        actorType: "ADMIN",
        action: `Approved proposal: "${proposal.title}"`,
        module: "Approval Workflow",
        targetId: proposal._id,
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
    } else if (action === "reject") {
      proposal.status = "REJECTED";
      proposal.reviewedAt = new Date();
      if (rejectionReason) {
        proposal.rejectionReason = rejectionReason;
      }
      await proposal.save();

      await AuditLog.create({
        actorType: "ADMIN",
        action: `Rejected proposal: "${proposal.title}"`,
        module: "Approval Workflow",
        targetId: proposal._id,
        metadata: { action, proposalType: proposal.type },
      });

      console.log(`✅ [MONGODB ATLAS] Proposal ${id} Rejected`);

      return NextResponse.json({
        message: "Proposal rejected in MongoDB.",
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
        { message: "Invalid action. Use 'approve', 'reject', or 'vote'." },
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
