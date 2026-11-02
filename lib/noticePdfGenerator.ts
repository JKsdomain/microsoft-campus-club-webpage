import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";

export interface QuizNoticeData {
  quizName: string;
  quizLink: string;
  additionalContent?: string;
}

export interface EventNoticeData {
  eventName: string;
  presenters: string | string[];
  venue: string;
  date: string;
  time: string;
  additionalContent?: string;
}

export interface WinnerItem {
  name: string;
  year: string;
  department: string;
}

export interface QuizWinnersNoticeData {
  quizName: string;
  winners: WinnerItem[];
}

export interface ParticipantItem {
  name: string;
  year: string;
  department: string;
}

export interface ActiveParticipantsNoticeData {
  activityName: string;
  participants: ParticipantItem[];
  additionalContent?: string;
}

export interface PlacementNoticeData {
  activityName: string;
  link: string;
  additionalContent?: string;
}

function getTemplatePath(templateFileName: string): string {
  // First check public directory in project
  const p1 = path.join(process.cwd(), "public", "templates", "notices", templateFileName);
  if (fs.existsSync(p1)) return p1;
  // Fallback to D:\notice if available
  const fallbackMapping: Record<string, string> = {
    "quiz_notice_template.pdf": "Weekly quiz college notice.pdf",
    "event_notice_template.pdf": "EVENT NOTICE TEMPLATE MCC.pdf",
    "quiz_winners_notice_template.pdf": "QUIZ NOTICE TEMPLATE MCC.pdf",
    "active_participants_notice_template.pdf": "ACTIVE PARTICIPANTS NOTICE TEMPLATE MCC.pdf",
    "placement_notice_template.pdf": "Blue White Modern Cyber Security Workshop Invitation.pdf",
  };
  const dPath = path.join("D:", "notice", fallbackMapping[templateFileName] || templateFileName);
  if (fs.existsSync(dPath)) return dPath;
  throw new Error(`Template not found: ${templateFileName}`);
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// 1. QUIZ NOTICE GENERATOR
export async function generateQuizNoticePdf(data: QuizNoticeData): Promise<Uint8Array> {
  const templatePath = getTemplatePath("quiz_notice_template.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const doc = await PDFDocument.load(templateBytes);
  const page = doc.getPages()[0];
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  // Cover placeholder "QUIZ TOPIC" (top ~485) and "WEEK NO." (top ~590)
  // Dimensions: x=60 to 535, top=465 to 645 -> y in pdf-lib = (height - 645) to (height - 465)
  const coverY = height - 645;
  const coverH = 180;
  page.drawRectangle({
    x: 60,
    y: coverY,
    width: width - 120,
    height: coverH,
    color: rgb(0.015, 0.047, 0.17), // Deep navy matching card
  });

  // Draw Quiz Name (centered, wrapped if needed)
  const quizTitle = (data.quizName || "WEEKLY QUIZ").toUpperCase();
  const titleSize = quizTitle.length > 35 ? 20 : 24;
  const titleLines = wrapText(quizTitle, fontBold, titleSize, width - 140);
  let curY = height - 510;
  for (const line of titleLines) {
    const lineW = fontBold.widthOfTextAtSize(line, titleSize);
    page.drawText(line, {
      x: (width - lineW) / 2,
      y: curY,
      size: titleSize,
      font: fontBold,
      color: rgb(0.98, 0.85, 0.37), // Golden accent
    });
    curY -= titleSize + 6;
  }

  // Draw optional Additional Content
  if (data.additionalContent && data.additionalContent.trim()) {
    const noteSize = 13;
    const noteLines = wrapText(data.additionalContent.trim(), fontRegular, noteSize, width - 150);
    curY -= 8;
    for (const nline of noteLines.slice(0, 3)) {
      const nw = fontRegular.widthOfTextAtSize(nline, noteSize);
      page.drawText(nline, {
        x: (width - nw) / 2,
        y: curY,
        size: noteSize,
        font: fontRegular,
        color: rgb(0.85, 0.92, 1.0),
      });
      curY -= noteSize + 4;
    }
  }

  // Cover placeholder link at top ~730 to 765
  const linkCoverY = height - 765;
  page.drawRectangle({
    x: 50,
    y: linkCoverY,
    width: width - 100,
    height: 35,
    color: rgb(0.0, 0.035, 0.15),
  });

  // Draw actual Quiz Link
  const linkText = (data.quizLink || "https://microsoft-campus-club-webpage.vercel.app/students-corner").trim();
  const linkSize = linkText.length > 50 ? 10 : 12;
  const linkW = fontBold.widthOfTextAtSize(linkText, linkSize);
  page.drawText(linkText, {
    x: Math.max(55, (width - linkW) / 2),
    y: height - 752,
    size: linkSize,
    font: fontBold,
    color: rgb(0.13, 0.83, 0.93), // Cyan
  });

  return await doc.save();
}

// 2. EVENT NOTICE GENERATOR
export async function generateEventNoticePdf(data: EventNoticeData): Promise<Uint8Array> {
  const templatePath = getTemplatePath("event_notice_template.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const doc = await PDFDocument.load(templateBytes);
  const page = doc.getPages()[0];
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  // 1. Cover and draw EVENT NAME (top ~480 to 600)
  page.drawRectangle({
    x: 180,
    y: height - 605,
    width: width - 360,
    height: 120,
    color: rgb(0.40, 0.63, 0.60), // Teal background matching template
  });
  const eventName = (data.eventName || "EVENT NAME").toUpperCase();
  const eventNameSize = eventName.length > 30 ? 32 : 40;
  const nameLines = wrapText(eventName, fontBold, eventNameSize, width - 400);
  let evY = height - 525;
  for (const line of nameLines) {
    const lw = fontBold.widthOfTextAtSize(line, eventNameSize);
    page.drawText(line, {
      x: (width - lw) / 2,
      y: evY,
      size: eventNameSize,
      font: fontBold,
      color: rgb(1.0, 1.0, 1.0),
    });
    evY -= eventNameSize + 6;
  }

  // 2. Cover & draw Date (top ~865 to 915)
  page.drawRectangle({
    x: 350,
    y: height - 915,
    width: width - 700,
    height: 48,
    color: rgb(0.56, 0.73, 0.70),
  });
  const dateStr = `Date: ${data.date || "TBA"}`;
  const dateW = fontBold.widthOfTextAtSize(dateStr, 24);
  page.drawText(dateStr, {
    x: (width - dateW) / 2,
    y: height - 900,
    size: 24,
    font: fontBold,
    color: rgb(0.05, 0.18, 0.16),
  });

  // 3. Cover & draw Time (top ~918 to 960)
  page.drawRectangle({
    x: 350,
    y: height - 960,
    width: width - 700,
    height: 42,
    color: rgb(0.58, 0.74, 0.72),
  });
  const timeStr = `Time: ${data.time || "TBA"}`;
  const timeW = fontBold.widthOfTextAtSize(timeStr, 22);
  page.drawText(timeStr, {
    x: (width - timeW) / 2,
    y: height - 948,
    size: 22,
    font: fontBold,
    color: rgb(0.05, 0.18, 0.16),
  });

  // 4. Cover & draw Venue (top ~962 to 1010)
  page.drawRectangle({
    x: 300,
    y: height - 1010,
    width: width - 600,
    height: 46,
    color: rgb(0.60, 0.75, 0.73),
  });
  const venueStr = `Venue: ${data.venue || "TBA"}`;
  const venueW = fontBold.widthOfTextAtSize(venueStr, 24);
  page.drawText(venueStr, {
    x: (width - venueW) / 2,
    y: height - 998,
    size: 24,
    font: fontBold,
    color: rgb(0.05, 0.18, 0.16),
  });

  // 5. Presenters list (top ~ 1080 to 1270)
  // Cover presenters placeholder area
  page.drawRectangle({
    x: 250,
    y: height - 1280,
    width: width - 500,
    height: 190,
    color: rgb(0.64, 0.78, 0.76),
  });
  const presentersList: string[] = Array.isArray(data.presenters)
    ? data.presenters
    : String(data.presenters || "")
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  let presY = height - 1115;
  const pSize = presentersList.length > 3 ? 20 : 23;
  for (const pres of presentersList.slice(0, 5)) {
    const pw = fontBold.widthOfTextAtSize(pres, pSize);
    page.drawText(pres, {
      x: (width - pw) / 2,
      y: presY,
      size: pSize,
      font: fontBold,
      color: rgb(0.04, 0.15, 0.14),
    });
    presY -= pSize + 10;
  }

  // 6. Cover & draw Extra Content (top ~1320 to 1420)
  page.drawRectangle({
    x: 200,
    y: height - 1420,
    width: width - 400,
    height: 90,
    color: rgb(0.38, 0.62, 0.58),
  });
  if (data.additionalContent && data.additionalContent.trim()) {
    const exLines = wrapText(data.additionalContent.trim(), fontRegular, 19, width - 450);
    let exY = height - 1350;
    for (const eline of exLines.slice(0, 2)) {
      const ew = fontRegular.widthOfTextAtSize(eline, 19);
      page.drawText(eline, {
        x: (width - ew) / 2,
        y: exY,
        size: 19,
        font: fontRegular,
        color: rgb(1.0, 1.0, 1.0),
      });
      exY -= 25;
    }
  }

  return await doc.save();
}

// 3. QUIZ WINNERS NOTICE GENERATOR
export async function generateQuizWinnersNoticePdf(data: QuizWinnersNoticeData): Promise<Uint8Array> {
  const templatePath = getTemplatePath("quiz_winners_notice_template.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const doc = await PDFDocument.load(templateBytes);
  const page = doc.getPages()[0];
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  // Card interior is from top ~ 560 to 1550 (y: height - 1550 to height - 560)
  // Fill the main content card with dark purple/navy gradient base
  page.drawRectangle({
    x: 120,
    y: height - 1560,
    width: width - 240,
    height: 970,
    color: rgb(0.04, 0.02, 0.13), // Deep royal purple/navy
    opacity: 0.94,
  });

  // Decorative border
  page.drawRectangle({
    x: 130,
    y: height - 1550,
    width: width - 260,
    height: 950,
    borderColor: rgb(0.85, 0.70, 0.35), // Gold border
    borderWidth: 2,
  });

  // Draw Quiz Name
  const quizTitle = (data.quizName || "WEEKLY QUIZ").toUpperCase();
  const qLines = wrapText(quizTitle, fontBold, 34, width - 320);
  let qY = height - 630;
  for (const ql of qLines) {
    const qw = fontBold.widthOfTextAtSize(ql, 34);
    page.drawText(ql, {
      x: (width - qw) / 2,
      y: qY,
      size: 34,
      font: fontBold,
      color: rgb(0.98, 0.84, 0.35), // Bright Gold
    });
    qY -= 42;
  }

  // Subheader banner
  const subBanner = "WINNERS OF THE COMPETITION";
  const subw = fontBold.widthOfTextAtSize(subBanner, 18);
  page.drawText(subBanner, {
    x: (width - subw) / 2,
    y: qY - 10,
    size: 18,
    font: fontBold,
    color: rgb(0.70, 0.85, 1.0),
  });

  // Render Winners List dynamically without serial numbers
  const winners = Array.isArray(data.winners) ? data.winners : [];
  let winY = qY - 60;
  const count = winners.length;
  const itemGap = count > 6 ? 68 : count > 4 ? 85 : 105;

  for (let i = 0; i < winners.length; i++) {
    const w = winners[i];
    if (winY < height - 1530) break; // Don't overflow bottom

    // Winner card container
    page.drawRectangle({
      x: 160,
      y: winY - (itemGap - 25),
      width: width - 320,
      height: itemGap - 15,
      color: rgb(0.11, 0.07, 0.26),
      borderColor: rgb(0.35, 0.25, 0.60),
      borderWidth: 1,
    });

    // Star badge representation using clean geometry
    page.drawCircle({
      x: 195,
      y: winY - 14,
      size: 7,
      color: rgb(0.98, 0.84, 0.35),
    });
    page.drawCircle({
      x: 195,
      y: winY - 14,
      size: 4,
      color: rgb(0.11, 0.07, 0.26),
    });

    // Winner Name (Bold, prominent)
    const nameStr = (w.name || "Student Name").trim();
    const nameSize = count > 6 ? 23 : 26;
    page.drawText(nameStr, {
      x: 225,
      y: winY - 12,
      size: nameSize,
      font: fontBold,
      color: rgb(1.0, 1.0, 1.0),
    });

    // Year & Department (NO serial numbers!)
    const deptStr = [w.year ? `${w.year} Year` : null, w.department || null]
      .filter(Boolean)
      .join(" — ");
    const deptSize = count > 6 ? 16 : 18;
    if (deptStr) {
      page.drawText(deptStr, {
        x: 225,
        y: winY - 12 - deptSize - 6,
        size: deptSize,
        font: fontRegular,
        color: rgb(0.40, 0.85, 0.95), // Cyan/light blue
      });
    }

    winY -= itemGap;
  }

  return await doc.save();
}

// 4. ACTIVE PARTICIPANTS NOTICE GENERATOR
export async function generateActiveParticipantsNoticePdf(data: ActiveParticipantsNoticeData): Promise<Uint8Array> {
  const templatePath = getTemplatePath("active_participants_notice_template.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const doc = await PDFDocument.load(templateBytes);
  const page = doc.getPages()[0];
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  // Cover placeholder "EVENT NAME" at top ~ 135 to 155
  page.drawRectangle({
    x: 40,
    y: height - 158,
    width: width - 80,
    height: 24,
    color: rgb(0.85, 0.89, 0.94),
  });

  // Draw Activity Name
  const actName = (data.activityName || "ACTIVITY / EVENT").toUpperCase();
  const actSize = actName.length > 25 ? 11 : 13;
  const actLines = wrapText(actName, fontBold, actSize, width - 80);
  let aY = height - 148;
  for (const aline of actLines.slice(0, 2)) {
    const aw = fontBold.widthOfTextAtSize(aline, actSize);
    page.drawText(aline, {
      x: (width - aw) / 2,
      y: aY,
      size: actSize,
      font: fontBold,
      color: rgb(0.04, 0.16, 0.38), // Navy
    });
    aY -= actSize + 3;
  }

  // Cover placeholder content & draw Participants List from top ~ 168 to 380
  const partAreaH = 210;
  page.drawRectangle({
    x: 25,
    y: height - 382,
    width: width - 50,
    height: partAreaH,
    color: rgb(0.88, 0.91, 0.96),
    borderColor: rgb(0.70, 0.78, 0.90),
    borderWidth: 1,
  });

  const participants = Array.isArray(data.participants) ? data.participants : [];
  let pY = height - 188;
  const pCount = participants.length;
  const rowH = pCount > 6 ? 26 : pCount > 4 ? 34 : 42;

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    if (pY < height - 375) break;

    // Bullet dot
    page.drawCircle({
      x: 38,
      y: pY - 2,
      size: 2.5,
      color: rgb(0.0, 0.47, 0.83), // MCC Blue
    });

    // Name (Bold)
    const nameStr = (p.name || "Student Name").trim();
    const nameSize = pCount > 6 ? 9 : 10.5;
    page.drawText(nameStr, {
      x: 48,
      y: pY,
      size: nameSize,
      font: fontBold,
      color: rgb(0.04, 0.12, 0.25),
    });

    // Year & Dept (NO serial numbers!)
    const deptStr = [p.year ? `${p.year} Yr` : null, p.department || null]
      .filter(Boolean)
      .join(" — ");
    const deptSize = pCount > 6 ? 7.5 : 8.5;
    if (deptStr) {
      page.drawText(deptStr, {
        x: 48,
        y: pY - deptSize - 3,
        size: deptSize,
        font: fontRegular,
        color: rgb(0.15, 0.35, 0.55),
      });
    }

    pY -= rowH;
  }

  // Cover & draw "ANY OTHER CONTENT" at top ~ 388 to 412
  page.drawRectangle({
    x: 30,
    y: height - 414,
    width: width - 60,
    height: 24,
    color: rgb(0.83, 0.80, 0.90),
  });
  if (data.additionalContent && data.additionalContent.trim()) {
    const extra = data.additionalContent.trim();
    const exW = fontRegular.widthOfTextAtSize(extra, 7.5);
    page.drawText(extra, {
      x: Math.max(32, (width - exW) / 2),
      y: height - 404,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.10, 0.15, 0.35),
    });
  }

  return await doc.save();
}

// 5. PLACEMENT QUESTIONS NOTICE GENERATOR
export async function generatePlacementNoticePdf(data: PlacementNoticeData): Promise<Uint8Array> {
  const templatePath = getTemplatePath("placement_notice_template.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const doc = await PDFDocument.load(templateBytes);
  const page = doc.getPages()[0];
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  // 1. Cover & draw Activity Name (top ~ 178 to 215)
  page.drawRectangle({
    x: 20,
    y: height - 215,
    width: width - 40,
    height: 38,
    color: rgb(0.005, 0.165, 0.37), // Dark navy blue
  });
  const actName = (data.activityName || "PLACEMENT TRAINING").toUpperCase();
  const actSize = actName.length > 25 ? 12 : 14;
  const actLines = wrapText(actName, fontBold, actSize, width - 50);
  let plY = height - 195;
  for (const line of actLines) {
    const lw = fontBold.widthOfTextAtSize(line, actSize);
    page.drawText(line, {
      x: (width - lw) / 2,
      y: plY,
      size: actSize,
      font: fontBold,
      color: rgb(0.35, 0.95, 1.0), // Bright Cyan
    });
    plY -= actSize + 3;
  }

  // 2. Cover & draw Link (top ~ 248 to 280)
  page.drawRectangle({
    x: 35,
    y: height - 280,
    width: width - 70,
    height: 32,
    color: rgb(0.31, 0.86, 0.92), // Cyan banner
  });
  const linkText = (data.link || "https://microsoft-campus-club-webpage.vercel.app/students-corner").trim();
  const linkSize = linkText.length > 40 ? 7.5 : 8.5;
  const linkLines = wrapText(linkText, fontBold, linkSize, width - 80);
  let lkY = height - 263;
  for (const lk of linkLines.slice(0, 2)) {
    const lkw = fontBold.widthOfTextAtSize(lk, linkSize);
    page.drawText(lk, {
      x: (width - lkw) / 2,
      y: lkY,
      size: linkSize,
      font: fontBold,
      color: rgb(0.005, 0.12, 0.28), // Dark navy text
    });
    lkY -= linkSize + 2;
  }

  // 3. Cover & draw Additional Content (top ~ 348 to 395)
  page.drawRectangle({
    x: 25,
    y: height - 395,
    width: width - 50,
    height: 48,
    color: rgb(0.0, 0.118, 0.267),
  });
  const extraText = (
    data.additionalContent && data.additionalContent.trim()
      ? data.additionalContent.trim()
      : "Empower Yourself with Knowledge! Gain experience on company-level questions."
  );
  const extraLines = wrapText(extraText, fontRegular, 8.5, width - 60);
  let exY = height - 365;
  for (const eline of extraLines.slice(0, 3)) {
    const ew = fontRegular.widthOfTextAtSize(eline, 8.5);
    page.drawText(eline, {
      x: (width - ew) / 2,
      y: exY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.90, 0.95, 1.0),
    });
    exY -= 11;
  }

  return await doc.save();
}

// Master dispatcher function
export async function generateNoticePdf(
  noticeType: string,
  contentData: any
): Promise<Uint8Array> {
  switch (noticeType) {
    case "QUIZ_NOTICE":
      return await generateQuizNoticePdf(contentData);
    case "EVENT_NOTICE":
      return await generateEventNoticePdf(contentData);
    case "QUIZ_WINNERS_NOTICE":
      return await generateQuizWinnersNoticePdf(contentData);
    case "ACTIVE_PARTICIPANTS_NOTICE":
      return await generateActiveParticipantsNoticePdf(contentData);
    case "PLACEMENT_QUESTIONS_NOTICE":
      return await generatePlacementNoticePdf(contentData);
    default:
      throw new Error(`Unsupported notice type: ${noticeType}`);
  }
}
