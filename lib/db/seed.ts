import fs from "fs";
import path from "path";
import { dbConnect } from "./dbConnect";
import { Responsibility, SystemSetting, Admin } from "./models";

export async function initDatabaseDefaults() {
  // If process.env.MONGODB_URI is not set, attempt loading from .env.local for CLI runner
  if (!process.env.MONGODB_URI) {
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/^MONGODB_URI\s*=\s*["']?([^"'\r\n]+)["']?/m);
        if (match && match[1]) {
          process.env.MONGODB_URI = match[1].trim();
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  await dbConnect();

  // 1. Initial Responsibilities
  const defaultResponsibilities = [
    { code: "GENERAL_QUIZ", name: "General Quiz", description: "Manage weekly trivia quiz rounds." },
    { code: "PLACEMENT_QUESTIONS", name: "Placement Questions", description: "Manage technical placement question sets." },
    { code: "TECHNICAL_GAMES", name: "Technical Games", description: "Manage technical gaming challenges and arenas." },
    { code: "FEED_COMMUNITY", name: "Feed Community", description: "Manage official MCC community announcements and feed." },
  ];

  for (const resp of defaultResponsibilities) {
    await Responsibility.updateOne(
      { code: resp.code },
      { $setOnInsert: { name: resp.name, description: resp.description, status: "ACTIVE" } },
      { upsert: true }
    );
  }

  // 2. Initial System Settings
  const defaultSettings = [
    { key: "placementViolationThreshold", value: 3, description: "Max secure test environment violations before auto-submission." },
    { key: "weeklyLeaderboardStatus", value: "PUBLISHED", description: "Public visibility status of weekly leaderboard rankings." },
  ];

  for (const set of defaultSettings) {
    await SystemSetting.updateOne(
      { key: set.key },
      { $setOnInsert: { value: set.value, description: set.description } },
      { upsert: true }
    );
  }

  // 3. Initial Admin Account
  await Admin.updateOne(
    { email: "admin@mcc.edu" },
    {
      $setOnInsert: {
        name: "Administrator",
        email: "admin@mcc.edu",
        passwordHash: "admin123", // Secure hash placeholder
        role: "ADMIN",
        status: "ACTIVE",
      },
    },
    { upsert: true }
  );

  console.log("✅ [DATABASE INIT] Collections (responsibilities, system_settings, admins) initialized in MongoDB Atlas!");
}

// Allow direct execution via CLI (e.g. npx tsx lib/db/seed.ts)
if (require.main === module || (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("lib/db/seed.ts"))) {
  initDatabaseDefaults()
    .then(() => {
      console.log("🚀 [SEED CLI] Seeding complete! Database is initialized.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ [SEED CLI ERROR]:", err);
      process.exit(1);
    });
}
