import { NextResponse } from "next/server";
import { generateMembershipPDF, MembershipFormData } from "@/lib/pdfGenerator";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      date,
      name,
      rollNumberSection,
      department,
      gender,
      semester,
      dateOfBirth,
      batch,
      hostellerDayScholar,
      email,
      technicalCompetencies,
      declarationAccepted,
    } = body;

    // 1. Server-side Field Validation
    if (!name || !String(name).trim()) {
      return NextResponse.json({ message: "Full Name is required." }, { status: 400 });
    }
    if (!rollNumberSection || !String(rollNumberSection).trim()) {
      return NextResponse.json({ message: "Roll Number & Section is required." }, { status: 400 });
    }
    if (!department || !String(department).trim()) {
      return NextResponse.json({ message: "Department selection is required." }, { status: 400 });
    }
    if (!gender || !String(gender).trim()) {
      return NextResponse.json({ message: "Gender selection is required." }, { status: 400 });
    }
    if (!semester || !String(semester).trim()) {
      return NextResponse.json({ message: "Semester is required." }, { status: 400 });
    }
    if (!dateOfBirth || !String(dateOfBirth).trim()) {
      return NextResponse.json({ message: "Date of Birth is required." }, { status: 400 });
    }
    if (!batch || !String(batch).trim()) {
      return NextResponse.json({ message: "Batch selection is required." }, { status: 400 });
    }
    if (!hostellerDayScholar || !String(hostellerDayScholar).trim()) {
      return NextResponse.json({ message: "Hosteller / Day Scholar selection is required." }, { status: 400 });
    }

    const emailStr = String(email || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailStr || !emailRegex.test(emailStr)) {
      return NextResponse.json({ message: "A valid email address is required." }, { status: 400 });
    }

    if (!Array.isArray(technicalCompetencies) || technicalCompetencies.length === 0) {
      return NextResponse.json({ message: "Please select at least one technical competency." }, { status: 400 });
    }

    if (!declarationAccepted) {
      return NextResponse.json(
        { message: "You must accept the MCC membership declaration before generating your form." },
        { status: 400 }
      );
    }

    // 2. Format Data for PDF Generator
    const formData: MembershipFormData = {
      date: date || new Date().toISOString().split("T")[0],
      name: String(name).trim(),
      rollNumberSection: String(rollNumberSection).trim(),
      department: String(department).trim(),
      gender: String(gender).trim(),
      semester: String(semester).trim(),
      dateOfBirth: String(dateOfBirth).trim(),
      batch: String(batch).trim(),
      hostellerDayScholar: String(hostellerDayScholar).trim(),
      email: emailStr,
      technicalCompetencies: technicalCompetencies.map((c) => String(c).trim()),
      declarationAccepted: true,
    };

    // 3. Generate PDF Buffer
    const pdfBuffer = await generateMembershipPDF(formData);

    // Sanitize roll number for filename
    const sanitizedRoll = formData.rollNumberSection.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `MCC_Membership_Form_${sanitizedRoll || "Student"}.pdf`;

    console.log(`✅ [PDF API] Generated official membership PDF for: ${formData.email} (${fileName})`);

    // 4. Return PDF Binary Download Response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error: any) {
    console.error("❌ [PDF API ERROR]:", error);
    return NextResponse.json(
      { message: "Unable to generate your membership form. Please try again.", error: error.message },
      { status: 500 }
    );
  }
}
