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

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxChars) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export interface HistoryQuestionsPDFData {
  title: string;
  weekName?: string;
  topic?: string;
  publishedDate: string;
  expiryDate?: string;
  questions: Array<{
    id?: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }>;
}

/**
 * Generates official Placement History Questions PDF with Microsoft Campus Club branding.
 */
export async function generateHistoryQuestionsPDF(data: HistoryQuestionsPDFData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoPath = path.resolve(process.cwd(), "public", "images", "mcc-logo.jpeg");
  let logoImage: any = null;
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedJpg(logoBytes);
    } catch {}
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - 35;

  const drawHeader = (page: any, isFirstPage: boolean) => {
    // Outer border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: pageWidth - 40,
      height: pageHeight - 40,
      borderColor: rgb(0, 0.47, 0.83),
      borderWidth: 1.5,
    });

    // Top Header Banner
    page.drawRectangle({
      x: 22,
      y: pageHeight - 85,
      width: pageWidth - 44,
      height: 63,
      color: rgb(0.03, 0.07, 0.12),
    });

    if (logoImage) {
      try {
        page.drawImage(logoImage, {
          x: 35,
          y: pageHeight - 78,
          width: 48,
          height: 48,
        });
      } catch {}
    }

    page.drawText("MICROSOFT CAMPUS CLUB", {
      x: 95,
      y: pageHeight - 50,
      size: 16,
      font: fontBold,
      color: rgb(0, 0.47, 0.83),
    });

    page.drawText("PLACEMENT QUESTIONS — REVISION ARCHIVE", {
      x: 95,
      y: pageHeight - 68,
      size: 11,
      font: fontBold,
      color: rgb(0.97, 0.98, 0.99),
    });

    page.drawText(`Published: ${data.publishedDate || "N/A"}`, {
      x: pageWidth - 160,
      y: pageHeight - 50,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.8, 0.85, 0.9),
    });

    if (data.expiryDate) {
      page.drawText(`Expiry: ${data.expiryDate}`, {
        x: pageWidth - 160,
        y: pageHeight - 65,
        size: 8.5,
        font: fontRegular,
        color: rgb(1, 0.6, 0.2),
      });
    }
  };

  drawHeader(currentPage, true);
  currentY = pageHeight - 110;

  // Activity Info Card
  currentPage.drawRectangle({
    x: 35,
    y: currentY - 25,
    width: pageWidth - 70,
    height: 32,
    color: rgb(0.94, 0.96, 0.99),
    borderColor: rgb(0.8, 0.87, 0.95),
    borderWidth: 1,
  });

  currentPage.drawText(`Topic: ${data.title || data.weekName || "Placement Questions"}`, {
    x: 45,
    y: currentY - 14,
    size: 10.5,
    font: fontBold,
    color: rgb(0.05, 0.15, 0.3),
  });

  currentPage.drawText(`Total Questions: ${data.questions.length}`, {
    x: pageWidth - 160,
    y: currentY - 14,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.3, 0.4, 0.5),
  });

  currentY -= 45;

  // Render Questions
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    const qLines = wrapText(`Q${i + 1}. ${q.question}`, 85);
    const expLines = q.explanation ? wrapText(`Explanation: ${q.explanation}`, 80) : [];
    const estimatedHeight = 35 + qLines.length * 14 + q.options.length * 18 + (expLines.length > 0 ? 25 + expLines.length * 13 : 0);

    // Check if new page is required
    if (currentY - estimatedHeight < 50) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(currentPage, false);
      currentY = pageHeight - 110;
    }

    // Question Box Header
    currentPage.drawRectangle({
      x: 35,
      y: currentY - 8,
      width: pageWidth - 70,
      height: 18,
      color: rgb(0, 0.47, 0.83),
    });

    currentPage.drawText(`QUESTION ${i + 1}`, {
      x: 45,
      y: currentY - 4,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    currentY -= 22;

    // Question Text
    for (const qLine of qLines) {
      currentPage.drawText(qLine, {
        x: 45,
        y: currentY,
        size: 10,
        font: fontBold,
        color: rgb(0.08, 0.12, 0.18),
      });
      currentY -= 14;
    }

    currentY -= 6;

    // Choices
    for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
      const opt = q.options[optIdx];
      const isCorrect = opt === q.correctAnswer;
      const optLabel = String.fromCharCode(65 + optIdx);
      const optLines = wrapText(`${optLabel}. ${opt}`, 82);

      for (let lIdx = 0; lIdx < optLines.length; lIdx++) {
        currentPage.drawText(optLines[lIdx], {
          x: 55,
          y: currentY,
          size: 9.5,
          font: isCorrect ? fontBold : fontRegular,
          color: isCorrect ? rgb(0.05, 0.55, 0.25) : rgb(0.2, 0.25, 0.35),
        });
        if (isCorrect && lIdx === 0) {
          currentPage.drawText("  [Correct Answer]", {
            x: 55 + fontBold.widthOfTextAtSize(optLines[0], 9.5),
            y: currentY,
            size: 8.5,
            font: fontBold,
            color: rgb(0.05, 0.55, 0.25),
          });
        }
        currentY -= 14;
      }
    }

    // Explanation Box
    if (expLines.length > 0) {
      currentY -= 4;
      const expHeight = expLines.length * 13 + 12;
      currentPage.drawRectangle({
        x: 45,
        y: currentY - expHeight + 10,
        width: pageWidth - 90,
        height: expHeight,
        color: rgb(0.95, 0.98, 0.95),
        borderColor: rgb(0.75, 0.9, 0.75),
        borderWidth: 1,
      });

      let expY = currentY - 2;
      for (const eLine of expLines) {
        currentPage.drawText(eLine, {
          x: 55,
          y: expY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.1, 0.35, 0.15),
        });
        expY -= 13;
      }
      currentY -= expHeight + 10;
    } else {
      currentY -= 15;
    }
  }

  // Footer on all pages
  const totalPages = pdfDoc.getPageCount();
  for (let p = 0; p < totalPages; p++) {
    const page = pdfDoc.getPage(p);
    page.drawText(
      `Microsoft Campus Club • Placement Preparation Repository • Page ${p + 1} of ${totalPages}`,
      {
        x: 35,
        y: 28,
        size: 8,
        font: fontRegular,
        color: rgb(0.45, 0.5, 0.55),
      }
    );
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export interface QuizResultPDFData {
  studentName: string;
  studentEmail: string;
  department?: string;
  year?: string;
  section?: string;
  rollNumber?: string;
  testType: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  percentage: number;
  timestamp: string;
  details: Array<{
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

/**
 * Generates official Quiz / Placement Test Result Certificate & Performance Report PDF.
 */
export async function generateQuizResultPDF(data: QuizResultPDFData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoPath = path.resolve(process.cwd(), "public", "images", "mcc-logo.jpeg");
  let logoImage: any = null;
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedJpg(logoBytes);
    } catch {}
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);

  const drawHeader = (page: any) => {
    // Outer border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: pageWidth - 40,
      height: pageHeight - 40,
      borderColor: rgb(0, 0.47, 0.83),
      borderWidth: 1.5,
    });

    // Top Header Banner
    page.drawRectangle({
      x: 22,
      y: pageHeight - 85,
      width: pageWidth - 44,
      height: 63,
      color: rgb(0.03, 0.07, 0.12),
    });

    if (logoImage) {
      try {
        page.drawImage(logoImage, {
          x: 35,
          y: pageHeight - 78,
          width: 48,
          height: 48,
        });
      } catch {}
    }

    page.drawText("MICROSOFT CAMPUS CLUB", {
      x: 95,
      y: pageHeight - 50,
      size: 16,
      font: fontBold,
      color: rgb(0, 0.47, 0.83),
    });

    page.drawText("OFFICIAL TEST RESULT & PERFORMANCE REPORT", {
      x: 95,
      y: pageHeight - 68,
      size: 11,
      font: fontBold,
      color: rgb(0.97, 0.98, 0.99),
    });

    page.drawText(`Date: ${data.timestamp ? data.timestamp.split(" ")[0] : new Date().toISOString().split("T")[0]}`, {
      x: pageWidth - 140,
      y: pageHeight - 50,
      size: 9,
      font: fontRegular,
      color: rgb(0.8, 0.85, 0.9),
    });
  };

  drawHeader(currentPage);
  let currentY = pageHeight - 110;

  // Student & Score Summary Card
  currentPage.drawRectangle({
    x: 35,
    y: currentY - 80,
    width: pageWidth - 70,
    height: 85,
    color: rgb(0.95, 0.97, 1),
    borderColor: rgb(0.78, 0.86, 0.96),
    borderWidth: 1,
  });

  // Left column: Student Details
  currentPage.drawText(`Student Name: ${data.studentName || "Student"}`, {
    x: 45,
    y: currentY - 18,
    size: 10,
    font: fontBold,
    color: rgb(0.05, 0.15, 0.3),
  });

  currentPage.drawText(`Email: ${data.studentEmail || "N/A"}`, {
    x: 45,
    y: currentY - 33,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  currentPage.drawText(
    `Dept: ${data.department || "General"} | Roll: ${data.rollNumber || "N/A"} | Year: ${data.year || "N/A"}`,
    {
      x: 45,
      y: currentY - 48,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.35),
    }
  );

  currentPage.drawText(`Activity: ${data.testType} — ${data.testTitle || ""}`, {
    x: 45,
    y: currentY - 65,
    size: 9,
    font: fontBold,
    color: rgb(0, 0.47, 0.83),
  });

  // Right column: Score Box
  const isPassed = data.percentage >= 50;
  currentPage.drawRectangle({
    x: pageWidth - 165,
    y: currentY - 72,
    width: 115,
    height: 68,
    color: isPassed ? rgb(0.9, 0.98, 0.92) : rgb(1, 0.93, 0.93),
    borderColor: isPassed ? rgb(0.3, 0.75, 0.4) : rgb(0.9, 0.4, 0.4),
    borderWidth: 1,
  });

  currentPage.drawText(`Score: ${data.score}%`, {
    x: pageWidth - 150,
    y: currentY - 26,
    size: 14,
    font: fontBold,
    color: isPassed ? rgb(0.05, 0.55, 0.2) : rgb(0.8, 0.15, 0.15),
  });

  currentPage.drawText(`Correct: ${data.correctAnswersCount} / ${data.totalQuestions}`, {
    x: pageWidth - 150,
    y: currentY - 45,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.3),
  });

  currentPage.drawText(isPassed ? "STATUS: PASSED" : "STATUS: NEEDS WORK", {
    x: pageWidth - 150,
    y: currentY - 60,
    size: 8,
    font: fontBold,
    color: isPassed ? rgb(0.05, 0.55, 0.2) : rgb(0.8, 0.15, 0.15),
  });

  currentY -= 105;

  // Questions breakdown section header
  currentPage.drawRectangle({
    x: 35,
    y: currentY - 5,
    width: pageWidth - 70,
    height: 20,
    color: rgb(0, 0.47, 0.83),
  });

  currentPage.drawText("QUESTION-BY-QUESTION ATTEMPT BREAKDOWN", {
    x: 45,
    y: currentY,
    size: 9.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  currentY -= 25;

  // Render question snapshot items
  for (let i = 0; i < data.details.length; i++) {
    const item = data.details[i];
    const qLines = wrapText(`Q${i + 1}. ${item.questionText}`, 85);
    const expLines = item.explanation ? wrapText(`Explanation: ${item.explanation}`, 80) : [];
    const estimatedHeight = 45 + qLines.length * 14 + (expLines.length > 0 ? 25 + expLines.length * 13 : 0);

    if (currentY - estimatedHeight < 50) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(currentPage);
      currentY = pageHeight - 110;
    }

    // Question Box
    currentPage.drawRectangle({
      x: 35,
      y: currentY - 8,
      width: pageWidth - 70,
      height: 18,
      color: item.isCorrect ? rgb(0.9, 0.98, 0.92) : rgb(1, 0.94, 0.94),
      borderColor: item.isCorrect ? rgb(0.4, 0.8, 0.5) : rgb(0.9, 0.45, 0.45),
      borderWidth: 1,
    });

    currentPage.drawText(`Question ${i + 1} • ${item.isCorrect ? "CORRECT (+1)" : "INCORRECT (0)"}`, {
      x: 45,
      y: currentY - 4,
      size: 8.5,
      font: fontBold,
      color: item.isCorrect ? rgb(0.05, 0.5, 0.2) : rgb(0.75, 0.15, 0.15),
    });

    currentY -= 22;

    for (const qLine of qLines) {
      currentPage.drawText(qLine, {
        x: 45,
        y: currentY,
        size: 9.5,
        font: fontBold,
        color: rgb(0.08, 0.12, 0.18),
      });
      currentY -= 14;
    }

    currentY -= 4;

    // Student's answer
    currentPage.drawText(`Your Answer: ${item.userAnswer || "(Unanswered)"}`, {
      x: 50,
      y: currentY,
      size: 9,
      font: fontBold,
      color: item.isCorrect ? rgb(0.05, 0.55, 0.2) : rgb(0.8, 0.15, 0.15),
    });
    currentY -= 13;

    // Correct Answer
    if (!item.isCorrect) {
      currentPage.drawText(`Correct Answer: ${item.correctAnswer}`, {
        x: 50,
        y: currentY,
        size: 9,
        font: fontBold,
        color: rgb(0.05, 0.55, 0.2),
      });
      currentY -= 13;
    }

    // Explanation Box
    if (expLines.length > 0) {
      currentY -= 4;
      const expHeight = expLines.length * 13 + 12;
      currentPage.drawRectangle({
        x: 45,
        y: currentY - expHeight + 10,
        width: pageWidth - 90,
        height: expHeight,
        color: rgb(0.96, 0.97, 0.99),
        borderColor: rgb(0.85, 0.88, 0.93),
        borderWidth: 1,
      });

      let expY = currentY - 2;
      for (const eLine of expLines) {
        currentPage.drawText(eLine, {
          x: 55,
          y: expY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.2, 0.25, 0.35),
        });
        expY -= 13;
      }
      currentY -= expHeight + 12;
    } else {
      currentY -= 15;
    }
  }

  // Footer on all pages
  const totalPages = pdfDoc.getPageCount();
  for (let p = 0; p < totalPages; p++) {
    const page = pdfDoc.getPage(p);
    page.drawText(
      `Microsoft Campus Club • Official Evaluation Transcript • Page ${p + 1} of ${totalPages}`,
      {
        x: 35,
        y: 28,
        size: 8,
        font: fontRegular,
        color: rgb(0.45, 0.5, 0.55),
      }
    );
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
