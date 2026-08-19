import mongoose, { Schema, Document, Model } from "mongoose";

// 1. ADMINS
const AdminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "ADMIN" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 2. RESPONSIBILITIES
const ResponsibilitySchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

// 3. OFFICE_BEARERS
const OfficeBearerSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    department: { type: String, default: "Computer Science & Engineering" },
    responsibilityId: {
      type: Schema.Types.ObjectId,
      ref: "responsibilities",
      default: null,
      index: true,
    },
    role: { type: String, default: "OFFICE_BEARER" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    lastLoginAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
  },
  { timestamps: true }
);


// 4. ANNOUNCEMENTS
const AnnouncementSchema = new Schema(
  {
    title: { type: String, default: "" },
    content: { type: String, required: true },
    poster: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      type: { type: String, default: "IMAGE" },
    },
    isPinned: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "PUBLISHED",
      index: true,
    },
    publishedAt: { type: Date, default: Date.now, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
  },
  { timestamps: true }
);

// 5. PROPOSALS
const ProposalSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["GENERAL_QUIZ", "PLACEMENT_QUESTIONS", "FEED", "TECHNICAL_GAMES"],
      required: true,
      index: true,
    },
    title: { type: String, default: "" },
    referenceId: { type: Schema.Types.ObjectId, default: null, index: true },
    submittedBy: { type: String, required: true, index: true },
    authorDepartment: { type: String, default: "Computer Science & Engineering" },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED", "PENDING_REAPPROVAL", "ARCHIVED"],
      default: "PENDING",
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
    rejectionReason: { type: String, default: null },
    // Quiz/Placement specific metadata
    questionsToUpload: { type: Number, default: null },
    questionsToDisplay: { type: Number, default: null },
    randomQuestions: { type: Boolean, default: null },
    randomChoices: { type: Boolean, default: null },
    timerMinutes: { type: Number, default: null },
    questionsDetected: { type: Number, default: null },
    csvFileName: { type: String, default: null },
    details: { type: String, default: "" },
    // Feed specific metadata
    mediaType: { type: String, enum: ["none", "image", "video", "IMAGE", "VIDEO"], default: "none" },
    mediaUrl: { type: String, default: null },
    mediaPublicId: { type: String, default: "" },
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    // Revision fields
    revisionNumber: { type: Number, default: 0 },
    parentId: { type: Schema.Types.ObjectId, ref: "proposals", default: null },
    isActive: { type: Boolean, default: true },
    revisionComment: { type: String, default: "" },
    // Timeline fields (General Quiz & Placement Questions)
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
  },
  { timestamps: true }
);


// 6. QUIZZES
const QuizSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    responsibility: { type: String, default: "GENERAL_QUIZ" },
    totalQuestions: { type: Number, required: true },
    questionsToDisplay: { type: Number, required: true },
    randomQuestions: { type: Boolean, default: true },
    randomChoices: { type: Boolean, default: true },
    timerMinutes: { type: Number, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    availabilityStatus: {
      type: String,
      enum: ["OPEN", "CLOSED", "COMING_SOON"],
      default: "OPEN",
      index: true,
    },
    publishedAt: { type: Date, default: null },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    createdBy: { type: String, required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 7. QUIZ_QUESTIONS
const QuizQuestionSchema = new Schema(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "quizzes", required: true, index: true },
    question: { type: String, required: true },
    choices: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    correctAnswer: { type: String, required: true }, // NEVER EXPOSED TO STUDENT
    explanation: { type: String, required: true },
    questionOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 8. PLACEMENT_QUESTION_SETS
const PlacementQuestionSetSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    totalQuestions: { type: Number, required: true },
    questionsToDisplay: { type: Number, required: true },
    randomQuestions: { type: Boolean, default: true },
    randomChoices: { type: Boolean, default: true },
    timerMinutes: { type: Number, required: true },
    availabilityStatus: {
      type: String,
      enum: ["OPEN", "CLOSED", "COMING_SOON"],
      default: "OPEN",
      index: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    weekId: { type: Schema.Types.ObjectId, default: null, index: true },
    publishedAt: { type: Date, default: null, index: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    createdBy: { type: String, required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 9. PLACEMENT_QUESTIONS
const PlacementQuestionSchema = new Schema(
  {
    setId: { type: Schema.Types.ObjectId, ref: "placement_question_sets", required: true, index: true },
    question: { type: String, required: true },
    choices: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    correctAnswer: { type: String, required: true }, // NEVER EXPOSED TO STUDENT
    explanation: { type: String, required: true },
    questionOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 10. TECHNICAL_GAMES
const TechnicalGameSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    availabilityStatus: {
      type: String,
      enum: ["OPEN", "CLOSED", "COMING_SOON"],
      default: "COMING_SOON",
      index: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    publishedAt: { type: Date, default: null },
    createdBy: { type: String, required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 11. FEED_POSTS
const FeedPostSchema = new Schema(
  {
    authorId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    media: [
      {
        type: { type: String, enum: ["IMAGE", "VIDEO"], required: true },
        url: { type: String, required: true },
        publicId: { type: String, default: "" },
      },
    ],
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED", "PUBLISHED", "ARCHIVED"],
      default: "PENDING",
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
    publishedAt: { type: Date, default: null, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 12. FEED_REACTIONS (Unique Index on feedPostId + actorId)
const FeedReactionSchema = new Schema(
  {
    feedPostId: { type: Schema.Types.ObjectId, ref: "feed_posts", required: true, index: true },
    actorId: { type: String, required: true, index: true },
    actorType: { type: String, default: "STUDENT" },
    reaction: { type: String, enum: ["LIKE", "DISLIKE"], required: true },
  },
  { timestamps: true }
);
FeedReactionSchema.index({ feedPostId: 1, actorId: 1 }, { unique: true });

// 13. TEST_ATTEMPTS
const TestAttemptSchema = new Schema(
  {
    // Student Details
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentEmailNormalized: { type: String, required: true, index: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    section: { type: String, required: true },
    rollNumber: { type: String, required: true },

    // Activity Details (activityId is the logical root proposal ID)
    activityId: { type: Schema.Types.ObjectId, required: true, index: true },
    activityType: {
      type: String,
      enum: ["GENERAL_QUIZ", "PLACEMENT_QUESTIONS"],
      required: true,
      index: true,
    },
    activityVersion: { type: Number, default: 0 },

    // Scores
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    wrongAnswers: { type: Number, required: true },
    percentage: { type: Number, required: true },

    // Immutable Question-Result Snapshot
    questionSnapshot: [
      {
        questionId: { type: String, required: true },
        question: { type: String, required: true },
        selectedAnswer: { type: String, required: true },
        correctAnswer: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        explanation: { type: String, required: true },
      },
    ],

    submittedAnswers: { type: Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["STARTED", "IN_PROGRESS", "SUBMITTED", "COMPLETED", "EXPIRED", "TERMINATED"],
      default: "COMPLETED",
      index: true,
    },
    violationCount: { type: Number, default: 0 },

    // Backward-compatibility legacy fields
    testType: { type: String, default: null },
    testId: { type: Schema.Types.ObjectId, default: null },
    participant: {
      username: { type: String, default: null },
      email: { type: String, default: null },
    },
    emailVerified: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    incorrectAnswers: { type: Number, default: null },
  },
  { timestamps: true }
);

// Enforce unique attempt per normalized student email + logical activity ID
TestAttemptSchema.index({ studentEmailNormalized: 1, activityId: 1 }, { unique: true });

// 14. TEST_ANSWERS
const TestAnswerSchema = new Schema(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: "test_attempts", required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, required: true, index: true },
    selectedAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }, // CALCULATED SERVER-SIDE ONLY
    answeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 15. LEADERBOARD_WEEKS
const LeaderboardWeekSchema = new Schema(
  {
    weekNumber: { type: Number, default: 1 },
    activityType: { type: String, default: "ALL", index: true },
    startDate: { type: Date, default: () => new Date(), index: true },
    endDate: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), index: true },
    status: {
      type: String,
      enum: ["GENERATED", "PENDING_APPROVAL", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"],
      default: "UNPUBLISHED",
      index: true,
    },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: String, default: null },
    publishedByRole: { type: String, default: null },
    approvedBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 16. LEADERBOARD_ENTRIES
const LeaderboardEntrySchema = new Schema(
  {
    weekId: { type: Schema.Types.ObjectId, ref: "leaderboard_weeks", required: true, index: true },
    participant: {
      username: { type: String, required: true },
      email: { type: String, required: true },
    },
    testType: { type: String, required: true },
    testId: { type: Schema.Types.ObjectId, required: true },
    attemptId: { type: Schema.Types.ObjectId, ref: "test_attempts", required: true },
    score: { type: Number, required: true, index: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    rank: { type: Number, required: true },
  },
  { timestamps: true }
);

// 17. AUDIT_LOGS
const AuditLogSchema = new Schema(
  {
    actorId: { type: String, default: null, index: true },
    actorType: {
      type: String,
      enum: ["ADMIN", "OFFICE_BEARER", "SYSTEM"],
      required: true,
    },
    action: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
);

// 18. SECURITY_EVENTS
const SecurityEventSchema = new Schema(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: "test_attempts", required: true, index: true },
    eventType: {
      type: String,
      enum: [
        "FULLSCREEN_EXIT",
        "TAB_HIDDEN",
        "WINDOW_BLUR",
        "REFRESH_ATTEMPT",
        "NAVIGATION_ATTEMPT",
      ],
      required: true,
      index: true,
    },
    questionNumber: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// 19. SYSTEM_SETTINGS
const SystemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "admins", default: null },
  },
  { timestamps: true }
);

// Register Models safely for Next.js hot-reloading
export const Admin = (mongoose.models.admins as Model<any>) || mongoose.model("admins", AdminSchema);
export const Responsibility = (mongoose.models.responsibilities as Model<any>) || mongoose.model("responsibilities", ResponsibilitySchema);
export const OfficeBearer = (mongoose.models.office_bearers as Model<any>) || mongoose.model("office_bearers", OfficeBearerSchema);
export const Announcement = (mongoose.models.announcements as Model<any>) || mongoose.model("announcements", AnnouncementSchema);
export const ProposalModel = (mongoose.models.proposals as Model<any>) || mongoose.model("proposals", ProposalSchema);
export const Quiz = (mongoose.models.quizzes as Model<any>) || mongoose.model("quizzes", QuizSchema);
export const QuizQuestion = (mongoose.models.quiz_questions as Model<any>) || mongoose.model("quiz_questions", QuizQuestionSchema);
export const PlacementQuestionSet = (mongoose.models.placement_question_sets as Model<any>) || mongoose.model("placement_question_sets", PlacementQuestionSetSchema);
export const PlacementQuestion = (mongoose.models.placement_questions as Model<any>) || mongoose.model("placement_questions", PlacementQuestionSchema);
export const TechnicalGame = (mongoose.models.technical_games as Model<any>) || mongoose.model("technical_games", TechnicalGameSchema);
export const FeedPost = (mongoose.models.feed_posts as Model<any>) || mongoose.model("feed_posts", FeedPostSchema);
export const FeedReaction = (mongoose.models.feed_reactions as Model<any>) || mongoose.model("feed_reactions", FeedReactionSchema);
export const TestAttempt = (mongoose.models.test_attempts as Model<any>) || mongoose.model("test_attempts", TestAttemptSchema);
export const TestAnswer = (mongoose.models.test_answers as Model<any>) || mongoose.model("test_answers", TestAnswerSchema);
export const LeaderboardWeek = (mongoose.models.leaderboard_weeks as Model<any>) || mongoose.model("leaderboard_weeks", LeaderboardWeekSchema);
export const LeaderboardEntryModel = (mongoose.models.leaderboard_entries as Model<any>) || mongoose.model("leaderboard_entries", LeaderboardEntrySchema);
export const AuditLog = (mongoose.models.audit_logs as Model<any>) || mongoose.model("audit_logs", AuditLogSchema);
export const SecurityEvent = (mongoose.models.security_events as Model<any>) || mongoose.model("security_events", SecurityEventSchema);
export const SystemSetting = (mongoose.models.system_settings as Model<any>) || mongoose.model("system_settings", SystemSettingSchema);
