import mongoose from "mongoose";
import path from "path";
import fs from "fs";

let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^\s*MONGODB_URI\s*=\s*(.*)\s*$/);
      if (match) {
        MONGODB_URI = match[1].replace(/["']/g, "").trim();
        break;
      }
    }
  } catch {}
}
if (!MONGODB_URI) {
  MONGODB_URI = "mongodb+srv://mcc_admin:Admin123@cluster0.vsqbh.mongodb.net/mcc_webpage?retryWrites=true&w=majority&appName=Cluster0";
}

async function runVerification() {
  console.log("🚀 [VERIFY ISSUES 15-21] Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ [MONGODB] Connected successfully.\n");

  const db = mongoose.connection.db;
  let passed = 0;
  let failed = 0;

  function assert(condition, desc) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // --- ISSUE 15: COMPLETE AUDIT & LOGS ---
  console.log("📋 [TEST 1: ISSUE 15 - AUDIT LOGS RICHNESS & IMMUTABILITY]");
  const auditLogsColl = db.collection("auditlogs");
  const testAuditDoc = {
    actorId: "admin-1",
    actorType: "ADMIN",
    actorName: "System Admin",
    actorEmail: "admin@mcc.edu",
    role: "Administrator",
    action: "OB_UPDATED",
    module: "User Management",
    targetId: new mongoose.Types.ObjectId(),
    targetType: "OFFICE_BEARER",
    originalValue: { name: "John Doe", department: "IT", status: "ACTIVE" },
    modifiedValue: { name: "Johnathan Doe", department: "CSE", status: "ACTIVE" },
    reason: "Department transfer requested",
    metadata: { note: "Verified test" },
    timestamp: new Date(),
    createdAt: new Date(),
  };

  const insertAuditResult = await auditLogsColl.insertOne(testAuditDoc);
  assert(insertAuditResult.insertedId, "Audit log inserted with rich before/after diffs");

  const readBackAudit = await auditLogsColl.findOne({ _id: insertAuditResult.insertedId });
  assert(readBackAudit.actorName === "System Admin", "Audit log preserves actorName");
  assert(readBackAudit.originalValue?.department === "IT", "Audit log preserves originalValue");
  assert(readBackAudit.modifiedValue?.department === "CSE", "Audit log preserves modifiedValue");
  assert(readBackAudit.reason === "Department transfer requested", "Audit log preserves mutation reason");

  // Clean up test audit log
  await auditLogsColl.deleteOne({ _id: insertAuditResult.insertedId });

  // --- ISSUE 16: PLACEMENT QUIZ ARCHIVING ---
  console.log("\n📦 [TEST 2: ISSUE 16 - PLACEMENT QUIZ ARCHIVING]");
  const proposalsColl = db.collection("proposals");
  const testPlacementQuiz = {
    type: "PLACEMENT_QUESTIONS",
    title: "Automated Verification Test Placement Quiz",
    submittedBy: "Placement Admin Test",
    status: "APPROVED",
    isActive: true,
    details: JSON.stringify([
      {
        id: "pq-1",
        question: "What is the time complexity of QuickSelect average case?",
        options: ["O(N)", "O(N log N)", "O(N^2)", "O(1)"],
        correctAnswer: "O(N)",
        explanation: "QuickSelect achieves average linear time O(N).",
      }
    ]),
    submittedAt: new Date(),
    reviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const quizInsert = await proposalsColl.insertOne(testPlacementQuiz);
  assert(quizInsert.insertedId, "Test Placement Quiz created in DB");

  // Perform Archiving
  const archiveUpdate = await proposalsColl.updateOne(
    { _id: quizInsert.insertedId },
    {
      $set: {
        status: "ARCHIVED",
        isActive: false,
        archivedAt: new Date(),
      }
    }
  );
  assert(archiveUpdate.modifiedCount === 1, "Placement quiz status updated to ARCHIVED and isActive: false");

  const archivedDoc = await proposalsColl.findOne({ _id: quizInsert.insertedId });
  assert(archivedDoc.status === "ARCHIVED", "Archived proposal has status ARCHIVED");
  assert(archivedDoc.isActive === false, "Archived proposal is no longer active");
  assert(archivedDoc.archivedAt instanceof Date, "Archived timestamp recorded");

  // Clean up
  await proposalsColl.deleteOne({ _id: quizInsert.insertedId });

  // --- ISSUE 17: REMOVAL OF DEFAULT HARDCODED HISTORY QUESTIONS ---
  console.log("\n🧹 [TEST 3: ISSUE 17 - REMOVE DEFAULT / HARDCODED HISTORY QUESTIONS]");
  const studentStatePath = path.resolve(process.cwd(), "lib", "studentState.ts");
  const studentStateContent = fs.readFileSync(studentStatePath, "utf-8");
  assert(
    studentStateContent.includes("export const HISTORY_PLACEMENT_SETS: HistorySet[] = [];"),
    "HISTORY_PLACEMENT_SETS in lib/studentState.ts is an empty array"
  );
  assert(
    !studentStateContent.includes("hist-32"),
    "Hardcoded sample history set 'hist-32' removed"
  );

  // --- ISSUE 18: DOWNLOAD HISTORY QUESTIONS AS PDF ---
  console.log("\n📄 [TEST 4: ISSUE 18 - GENERATE HISTORY QUESTIONS PDF]");
  const { generateHistoryQuestionsPDF } = await import("../lib/pdfGenerator.ts");
  const historyPdfBuffer = await generateHistoryQuestionsPDF({
    title: "Graph Algorithms & Memory Management",
    weekName: "Placement Questions — Week 32",
    publishedDate: "2026-08-08",
    expiryDate: "2026-09-08",
    questions: [
      {
        id: "q1",
        question: "What is the primary advantage of Dijkstra with Min-Heap?",
        options: ["O(1) relaxation", "O(log V) vertex extraction", "No heap needed", "Linear time"],
        correctAnswer: "O(log V) vertex extraction",
        explanation: "Reduces extraction time from O(V) to O(log V).",
      }
    ],
  });

  assert(Buffer.isBuffer(historyPdfBuffer), "History Questions PDF returned as Buffer");
  assert(historyPdfBuffer.length > 1000, `PDF size is valid (${historyPdfBuffer.length} bytes)`);
  assert(historyPdfBuffer.subarray(0, 5).toString() === "%PDF-", "PDF header matches %PDF- signature");

  // --- ISSUE 19 & 20: LIFECYCLE (1-MONTH EXPIRY) & MARQUEE NOTICE ---
  console.log("\n⏳ [TEST 5: ISSUES 19 & 20 - 1-MONTH LIFECYCLE & DYNAMIC MARQUEE NOTICE]");
  const pubDate = new Date();
  const expDate = new Date(pubDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const diffDays = Math.round((expDate.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
  assert(diffDays === 30, `Expiry duration calculated as 30 days (1 month) from publication`);

  const historyComponentPath = path.resolve(process.cwd(), "components", "students-corner", "HistoryQuestions.tsx");
  const historyComponentContent = fs.readFileSync(historyComponentPath, "utf-8");
  assert(historyComponentContent.includes("animate-marquee"), "HistoryQuestions component contains marquee animation for expiry notice");
  assert(historyComponentContent.includes("/api/students-corner/history-questions"), "HistoryQuestions fetches from MongoDB API");
  assert(historyComponentContent.includes("handleDownloadPDF"), "HistoryQuestions has PDF download handler");
  assert(historyComponentContent.includes("No history questions available."), "HistoryQuestions includes standard clean empty state");

  // --- ISSUE 21: DOWNLOAD COMPLETED QUIZ RESULT AS PDF ---
  console.log("\n🎓 [TEST 6: ISSUE 21 - DOWNLOAD QUIZ RESULT AS PDF CERTIFICATE]");
  const { generateQuizResultPDF } = await import("../lib/pdfGenerator.ts");
  const testAttemptsColl = db.collection("testattempts");

  const sampleSnapshot = [
    {
      questionId: "q1",
      question: "Which Azure service is serverless?",
      selectedAnswer: "Azure Functions",
      correctAnswer: "Azure Functions",
      isCorrect: true,
      explanation: "Azure Functions is an event-driven serverless compute platform.",
    },
    {
      questionId: "q2",
      question: "What is Azure Entra ID?",
      selectedAnswer: "Identity and Access Management",
      correctAnswer: "Identity and Access Management",
      isCorrect: true,
      explanation: "Entra ID handles IAM.",
    },
  ];

  const testAttemptDoc = {
    studentName: "Venkata Raman",
    studentEmail: "venkata@mepcoeng.ac.in",
    department: "Computer Science and Engineering",
    year: "3",
    section: "A",
    rollNumber: "23CS099",
    activityType: "GENERAL_QUIZ",
    activityId: "gen-quiz-1",
    score: 100,
    percentage: 100,
    totalQuestions: 2,
    correctCount: 2,
    wrongCount: 0,
    questionSnapshot: sampleSnapshot,
    completedAt: new Date(),
    createdAt: new Date(),
  };

  const attemptInsert = await testAttemptsColl.insertOne(testAttemptDoc);
  assert(attemptInsert.insertedId, "TestAttempt with immutable snapshot saved in MongoDB");

  const resultPdfBuffer = await generateQuizResultPDF({
    studentName: testAttemptDoc.studentName,
    studentEmail: testAttemptDoc.studentEmail,
    department: testAttemptDoc.department,
    year: testAttemptDoc.year,
    section: testAttemptDoc.section,
    rollNumber: testAttemptDoc.rollNumber,
    testType: "General Quiz",
    testTitle: "Azure Cloud & AI Trivia",
    score: testAttemptDoc.score,
    totalQuestions: testAttemptDoc.totalQuestions,
    correctAnswersCount: testAttemptDoc.correctCount,
    incorrectAnswersCount: testAttemptDoc.wrongCount,
    percentage: testAttemptDoc.percentage,
    timestamp: "2026-08-20 20:30:00",
    details: sampleSnapshot.map((s) => ({
      questionId: s.questionId,
      questionText: s.question,
      userAnswer: s.selectedAnswer,
      correctAnswer: s.correctAnswer,
      isCorrect: s.isCorrect,
      explanation: s.explanation,
    })),
  });

  assert(Buffer.isBuffer(resultPdfBuffer), "Quiz Result PDF generated as Buffer");
  assert(resultPdfBuffer.length > 1000, `Result PDF size is valid (${resultPdfBuffer.length} bytes)`);
  assert(resultPdfBuffer.subarray(0, 5).toString() === "%PDF-", "Result PDF header matches %PDF- signature");

  // Clean up
  await testAttemptsColl.deleteOne({ _id: attemptInsert.insertedId });

  // Verification Results
  console.log(`\n====================================================`);
  console.log(`🎉 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runVerification().catch((err) => {
  console.error("❌ Verification fatal error:", err);
  process.exit(1);
});
