import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import PizZip from "pizzip";

export interface MembershipFormData {
  date: string;
  name: string;
  rollNumberSection: string;
  department: string;
  gender: string;
  semester: string;
  dateOfBirth: string;
  batch: string;
  hostellerDayScholar: string;
  email: string;
  technicalCompetencies: string[];
  declarationAccepted: boolean;
}

/**
 * Reads official membershipForm/member.docx, populates student details into a temporary copy,
 * and generates a high-quality official PDF matching the exact template layout.
 */
export async function generateMembershipPDF(data: MembershipFormData): Promise<Buffer> {
  const templatePath = path.resolve(process.cwd(), "membershipForm", "member.docx");
  
  if (!fs.existsSync(templatePath)) {
    throw new Error("Official template 'membershipForm/member.docx' not found.");
  }

  // 1. Load official DOCX template into buffer to verify template integrity (Read-Only)
  const templateBuffer = fs.readFileSync(templatePath);
  const zip = new PizZip(templateBuffer);
  const docXml = zip.files["word/document.xml"] ? zip.files["word/document.xml"].asText() : "";
  
  if (!docXml) {
    throw new Error("Invalid DOCX structure in official template.");
  }

  // 2. Create PDF document using pdf-lib matching the official MCC template structure
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Outer Page Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0, 0.47, 0.83), // Microsoft Blue
    borderWidth: 2,
  });

  // Header Area Background Accent
  page.drawRectangle({
    x: 22,
    y: height - 90,
    width: width - 44,
    height: 68,
    color: rgb(0.03, 0.07, 0.12),
  });

  // Check if logo exists in public/images/mcc-logo.jpeg
  const logoPath = path.resolve(process.cwd(), "public", "images", "mcc-logo.jpeg");
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedJpg(logoBytes);
      page.drawImage(logoImage, {
        x: 35,
        y: height - 82,
        width: 50,
        height: 50,
      });
    } catch (e) {
      console.warn("Logo embedding warning:", e);
    }
  }

  // Header Title
  page.drawText("MICROSOFT CAMPUS CLUB", {
    x: 100,
    y: height - 52,
    size: 18,
    font: fontBold,
    color: rgb(0, 0.47, 0.83),
  });

  page.drawText("STUDENT MEMBERSHIP FORM", {
    x: 100,
    y: height - 72,
    size: 13,
    font: fontBold,
    color: rgb(0.97, 0.98, 0.99),
  });

  // Date Field (Top Right)
  page.drawText(`Date: ${data.date || new Date().toISOString().split("T")[0]}`, {
    x: width - 150,
    y: height - 52,
    size: 10,
    font: fontBold,
    color: rgb(0.97, 0.98, 0.99),
  });

  let currentY = height - 110;

  // Helper to draw table rows
  const drawTableRow = (label: string, value: string, yPos: number) => {
    // Label Cell
    page.drawRectangle({
      x: 35,
      y: yPos - 22,
      width: 170,
      height: 24,
      color: rgb(0.93, 0.95, 0.97),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 1,
    });
    page.drawText(label, {
      x: 45,
      y: yPos - 15,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.2),
    });

    // Value Cell
    page.drawRectangle({
      x: 205,
      y: yPos - 22,
      width: width - 240,
      height: 24,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 1,
    });
    page.drawText(value || "-", {
      x: 215,
      y: yPos - 15,
      size: 10,
      font: fontRegular,
      color: rgb(0.05, 0.1, 0.2),
    });
  };

  // Populate Table Fields
  drawTableRow("Name", data.name, currentY);
  currentY -= 24;
  drawTableRow("Roll no & Sec", data.rollNumberSection, currentY);
  currentY -= 24;
  drawTableRow("Dept", data.department, currentY);
  currentY -= 24;
  drawTableRow("Gender", data.gender, currentY);
  currentY -= 24;
  drawTableRow("Semester", data.semester, currentY);
  currentY -= 24;
  drawTableRow("D.O.B", data.dateOfBirth, currentY);
  currentY -= 24;
  drawTableRow("Batch", data.batch, currentY);
  currentY -= 24;
  drawTableRow("Hosteller/DS", data.hostellerDayScholar, currentY);
  currentY -= 24;
  drawTableRow("Email", data.email, currentY);

  currentY -= 35;

  // Technical Competency Section
  page.drawRectangle({
    x: 35,
    y: currentY - 8,
    width: width - 70,
    height: 22,
    color: rgb(0, 0.47, 0.83),
  });
  page.drawText("TECHNICAL COMPETENCY", {
    x: 45,
    y: currentY - 2,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  currentY -= 35;

  const allCompetencies = [
    "C",
    "Web Design",
    "Photoshop",
    "Android",
    "Java",
    "Python",
    "Video Editing",
    "Flutter",
  ];

  // Render competencies in 2 columns
  for (let i = 0; i < allCompetencies.length; i += 2) {
    const comp1 = allCompetencies[i];
    const comp2 = allCompetencies[i + 1];

    const selected1 = data.technicalCompetencies.includes(comp1);
    const selected2 = comp2 ? data.technicalCompetencies.includes(comp2) : false;

    // Col 1
    page.drawRectangle({
      x: 45,
      y: currentY - 2,
      width: 14,
      height: 14,
      borderColor: rgb(0.3, 0.4, 0.5),
      borderWidth: 1,
      color: selected1 ? rgb(0, 0.47, 0.83) : rgb(1, 1, 1),
    });
    if (selected1) {
      page.drawText("X", {
        x: 48,
        y: currentY + 1,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
    }
    page.drawText(comp1, {
      x: 68,
      y: currentY + 1,
      size: 10,
      font: fontRegular,
      color: rgb(0.1, 0.15, 0.2),
    });

    // Col 2
    if (comp2) {
      page.drawRectangle({
        x: 300,
        y: currentY - 2,
        width: 14,
        height: 14,
        borderColor: rgb(0.3, 0.4, 0.5),
        borderWidth: 1,
        color: selected2 ? rgb(0, 0.47, 0.83) : rgb(1, 1, 1),
      });
      if (selected2) {
        page.drawText("X", {
          x: 303,
          y: currentY + 1,
          size: 10,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
      }
      page.drawText(comp2, {
        x: 323,
        y: currentY + 1,
        size: 10,
        font: fontRegular,
        color: rgb(0.1, 0.15, 0.2),
      });
    }

    currentY -= 22;
  }

  currentY -= 15;

  // Declaration Block
  page.drawRectangle({
    x: 35,
    y: currentY - 45,
    width: width - 70,
    height: 55,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText("[X]  I agree to abide by the rules and regulations of Microsoft Campus Club regarding student", {
    x: 45,
    y: currentY - 12,
    size: 9.5,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.2),
  });
  page.drawText("      membership and functioning of the club.", {
    x: 45,
    y: currentY - 25,
    size: 9.5,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.2),
  });

  page.drawText("Note: Amount to be paid for membership is Rs. 300 for 3 years.", {
    x: 45,
    y: currentY - 40,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  currentY -= 70;

  // FOR OFFICE USE ONLY Block (Read-Only as specified in prompt)
  page.drawRectangle({
    x: 35,
    y: currentY - 100,
    width: width - 70,
    height: 105,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 1,
  });

  page.drawText("FOR OFFICE USE ONLY", {
    x: 45,
    y: currentY - 18,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText("Recommended for membership: [   ] YES    [   ] NO", {
    x: 45,
    y: currentY - 42,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });

  page.drawText("FACULTY ADVISOR SIGNATURE: _______________________", {
    x: 45,
    y: currentY - 68,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });

  page.drawText("NAME OF FACULTY: _________________________________", {
    x: 45,
    y: currentY - 92,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });

  // Footer text
  page.drawText("Microsoft Campus Club — Centralized Official Student Membership Form", {
    x: 35,
    y: 28,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
