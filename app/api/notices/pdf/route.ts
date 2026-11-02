import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/dbConnect";
import { Notice } from "@/lib/db/models";
import { generateNoticePdf } from "@/lib/noticePdfGenerator";

// GET /api/notices/pdf?id=[noticeId]&download=[true|false]
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const download = searchParams.get("download") === "true";

    if (!id) {
      return NextResponse.json({ message: "Notice id is required." }, { status: 400 });
    }

    await dbConnect();
    const notice = await Notice.findById(id);
    if (!notice) {
      return NextResponse.json({ message: "Notice not found." }, { status: 404 });
    }

    const pdfBytes = await generateNoticePdf(notice.noticeType, notice.contentData);
    const safeTitle = (notice.title || "mcc-notice").replace(/[^a-zA-Z0-9_-]/g, "_");

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": download
          ? `attachment; filename="${safeTitle}.pdf"`
          : `inline; filename="${safeTitle}.pdf"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error: any) {
    console.error("❌ [API GET /api/notices/pdf] Error:", error);
    return NextResponse.json(
      { message: "Failed to generate notice PDF.", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/notices/pdf - Generate on-the-fly preview PDF
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { noticeType, contentData } = body;

    if (!noticeType || !contentData) {
      return NextResponse.json(
        { message: "noticeType and contentData are required." },
        { status: 400 }
      );
    }

    const pdfBytes = await generateNoticePdf(noticeType, contentData);

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"preview-notice.pdf\"",
      },
    });
  } catch (error: any) {
    console.error("❌ [API POST /api/notices/pdf] Error:", error);
    return NextResponse.json(
      { message: "Failed to generate preview PDF.", error: error.message },
      { status: 500 }
    );
  }
}
