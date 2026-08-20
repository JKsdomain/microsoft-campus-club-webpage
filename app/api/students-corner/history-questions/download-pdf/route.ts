import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { ProposalModel } from "@/lib/db/models";
import { generateHistoryQuestionsPDF } from "@/lib/pdfGenerator";
import { ACTIVE_PLACEMENT_SET } from "@/lib/studentState";

// POST /api/students-corner/history-questions/download-pdf
// Accepts question set data or MongoDB proposal ID and generates an official MCC PDF.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, title, weekName, publishedDate, expiryDate, questions } = body;

    let pdfData = {
      title: title || "Placement Preparation Questions",
      weekName: weekName || "Placement Questions",
      publishedDate: publishedDate || new Date().toISOString().split("T")[0],
      expiryDate,
      questions: Array.isArray(questions) && questions.length > 0 ? questions : ACTIVE_PLACEMENT_SET.questions,
    };

    // If ID is provided, try loading the actual DB proposal
    if (id) {
      try {
        await dbConnect();
        const prop = await ProposalModel.findById(id);
        if (prop) {
          let dbQuestions = [];
          if (prop.details) {
            try {
              const parsed = JSON.parse(prop.details);
              if (Array.isArray(parsed)) dbQuestions = parsed;
              else if (Array.isArray(parsed.questions)) dbQuestions = parsed.questions;
            } catch {}
          }
          if (dbQuestions.length === 0) {
            dbQuestions = ACTIVE_PLACEMENT_SET.questions;
          }

          const pubDate = prop.reviewedAt || prop.submittedAt || prop.createdAt || new Date();
          const expDate = prop.expiresAt || new Date(new Date(pubDate).getTime() + 30 * 24 * 60 * 60 * 1000);

          pdfData = {
            title: prop.title || "Placement Questions",
            weekName: prop.title || "Placement Questions",
            publishedDate: new Date(pubDate).toISOString().split("T")[0],
            expiryDate: new Date(expDate).toISOString().split("T")[0],
            questions: dbQuestions,
          };
        }
      } catch (e) {
        console.warn("Could not query DB proposal for PDF, falling back to payload:", e);
      }
    }

    const pdfBuffer = await generateHistoryQuestionsPDF(pdfData);
    const safeTitle = (pdfData.weekName || pdfData.title || "placement-questions")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const fileName = `mcc-${safeTitle}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error: any) {
    console.error("❌ [API /history-questions/download-pdf] Error:", error);
    return NextResponse.json(
      { message: "Failed to generate history questions PDF.", error: error.message },
      { status: 500 }
    );
  }
}
