import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db/dbConnect";
import { LeaderboardWeek, TestAttempt, Admin, OfficeBearer } from "@/lib/db/models";
import * as XLSX from "xlsx";

// GET /api/leaderboard/export
// Downloads official Placement Questions Leaderboard as genuine .xlsx file.
// Server-side authorized ONLY for Admin and responsible Placement Questions Office Bearer.
export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const requestedType = searchParams.get("type") || "Placement Questions";
    const isQuiz = requestedType.toLowerCase().includes("quiz");
    const targetActivityType = isQuiz ? "GENERAL_QUIZ" : "PLACEMENT_QUESTIONS";
    const activityHumanTitle = isQuiz ? "General Quiz" : "Placement Questions";

    // 1. Authenticate Requester Session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("mcc_admin_session")?.value;
    const obSession = cookieStore.get("mcc_ob_session")?.value;

    let role: "ADMIN" | "OFFICE_BEARER" | null = null;
    let actorName = "";
    let obResponsibility = "";

    if (adminSession) {
      role = "ADMIN";
      const cleanEmail = decodeURIComponent(adminSession).trim().toLowerCase();
      const adminDoc = await Admin.findOne({ email: cleanEmail, status: "ACTIVE" });
      if (adminDoc) {
        actorName = adminDoc.name;
      }
    } else if (obSession) {
      role = "OFFICE_BEARER";
      const cleanEmail = decodeURIComponent(obSession).trim().toLowerCase();
      const obDoc = await OfficeBearer.findOne({ email: cleanEmail, status: "ACTIVE" }).populate("responsibilityId");
      if (obDoc) {
        actorName = obDoc.name;
        obResponsibility = obDoc.responsibilityId ? (obDoc.responsibilityId as any).name : "Unassigned";
      }
    }

    if (!role) {
      return NextResponse.json(
        { message: `Unauthorized. You must be logged in as an Administrator or ${activityHumanTitle} Office Bearer to export leaderboard reports.` },
        { status: 401 }
      );
    }

    // 2. Server-Side Authorization Check: ONLY Admin or Assigned OB
    if (role === "OFFICE_BEARER") {
      const normalizedResp = obResponsibility.toLowerCase().replace(/_/g, " ").trim();
      const isAuthorized = isQuiz
        ? (normalizedResp.includes("quiz") || normalizedResp.includes("general"))
        : normalizedResp.includes("placement");

      if (!isAuthorized) {
        return NextResponse.json(
          {
            message: `Unauthorized: Office Bearer assigned to "${obResponsibility}" cannot export the ${activityHumanTitle} leaderboard.`,
          },
          { status: 403 }
        );
      }
    }

    // 3. Query Week Document
    const weekDoc = await LeaderboardWeek.findOne({
      activityType: { $in: [targetActivityType, activityHumanTitle, "ALL"] }
    }).sort({ createdAt: -1 });

    const weekNumber = weekDoc?.weekNumber || 1;

    // 4. Retrieve Persisted MongoDB Test Attempts
    const dbTypes = isQuiz
      ? ["General Quiz", "GENERAL_QUIZ", "QUIZ"]
      : ["Placement Questions", "PLACEMENT_QUESTIONS", "PLACEMENT"];

    const attempts = await TestAttempt.find({
      status: { $in: ["COMPLETED", "SUBMITTED"] },
      activityType: { $in: dbTypes },
    })
      .sort({ score: -1, percentage: -1, submittedAt: 1 })
      .limit(1000);

    // Deduplicate to take best attempt per student
    const studentBestMap = new Map<string, any>();
    for (const att of attempts) {
      const key =
        att.studentEmailNormalized ||
        att.studentEmail?.toLowerCase() ||
        att.participant?.email?.toLowerCase() ||
        att.studentName ||
        att.participant?.username;

      if (!studentBestMap.has(key) || att.score > studentBestMap.get(key).score) {
        studentBestMap.set(key, att);
      }
    }

    const sortedUnique = Array.from(studentBestMap.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    // 5. Format Data for Excel Worksheet
    const excelRows = sortedUnique.map((att, index) => ({
      "Rank": index + 1,
      "Student Name": att.studentName || att.participant?.username || "Student",
      "Email": att.studentEmail || att.participant?.email || "",
      "Roll Number": att.rollNumber || "N/A",
      "Department": att.department || "General",
      "Year": att.year || "1",
      "Section": att.section || "A",
      "Score": att.score,
      "Total Questions": att.totalQuestions || 0,
      "Correct Answers": att.correctAnswers ?? att.correctCount ?? 0,
      "Wrong Answers": att.wrongAnswers ?? att.wrongCount ?? 0,
      "Percentage": `${att.percentage}%`,
      "Submission Date/Time": att.submittedAt
        ? new Date(att.submittedAt).toISOString().replace("T", " ").substring(0, 19)
        : "",
    }));

    // If no records, provide an informative header row
    const dataToWrite = excelRows.length > 0
      ? excelRows
      : [
          {
            "Rank": "",
            "Student Name": `No ${activityHumanTitle.toLowerCase()} results available yet.`,
            "Email": "",
            "Roll Number": "",
            "Department": "",
            "Year": "",
            "Section": "",
            "Score": "",
            "Total Questions": "",
            "Correct Answers": "",
            "Wrong Answers": "",
            "Percentage": "",
            "Submission Date/Time": "",
          },
        ];

    // 6. Generate Excel Workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToWrite);

    // Set Column Widths for readability
    worksheet["!cols"] = [
      { wch: 8 },  // Rank
      { wch: 25 }, // Student Name
      { wch: 30 }, // Email
      { wch: 15 }, // Roll Number
      { wch: 30 }, // Department
      { wch: 8 },  // Year
      { wch: 10 }, // Section
      { wch: 10 }, // Score
      { wch: 16 }, // Total Questions
      { wch: 16 }, // Correct Answers
      { wch: 16 }, // Wrong Answers
      { wch: 12 }, // Percentage
      { wch: 22 }, // Submission Date/Time
    ];

    const workbook = XLSX.utils.book_new();
    const sheetName = `${activityHumanTitle} Week ${weekNumber}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = `MCC_${activityHumanTitle.replace(/\s+/g, "_")}_Leaderboard_Week_${weekNumber}.xlsx`;

    console.log(`✅ [EXCEL EXPORT] ${activityHumanTitle} leaderboard exported by ${actorName || "Admin"} (${excelRows.length} entries)`);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("❌ [API GET /leaderboard/export] Error:", error);
    return NextResponse.json(
      { message: "Failed to export leaderboard report.", error: error.message },
      { status: 500 }
    );
  }
}
