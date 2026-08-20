export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface PublicTestQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface StudentInfo {
  name: string;
  department: string;
  year: string;
  section: string;
  email: string;
  rollNumber: string;
}

export const STUDENT_DEPARTMENTS = [
  "Artificial Intelligence & Data Science",
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
] as const;

export const STUDENT_YEARS = ["1", "2", "3", "4"] as const;

export interface StudentResultReport {
  attemptId: string;
  username: string;
  email: string;
  studentInfo?: StudentInfo;
  department?: string;
  year?: string;
  section?: string;
  rollNumber?: string;
  testType: "Placement Questions" | "General Quiz";
  testTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  percentage: number;
  timestamp: string;
  details: {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export interface HistorySet {
  id: string;
  weekName: string;
  title: string;
  completedDate: string;
  questionCount: number;
  topic: string;
  questions: TestQuestion[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  percentage: number;
  week: string;
}

export const ACTIVE_PLACEMENT_SET: { title: string; timerMinutes: number; questions: TestQuestion[] } = {
  title: "Dynamic Programming & System Design Round 1",
  timerMinutes: 30,
  questions: [
    {
      id: "q1",
      question: "What is the time complexity of solving the 0/1 Knapsack problem using dynamic programming with N items and W capacity?",
      options: ["O(N log N)", "O(N * W)", "O(2^N)", "O(N + W)"],
      correctAnswer: "O(N * W)",
      explanation: "Dynamic programming tabulates N items across all capacities from 0 to W, requiring O(N*W) time and space.",
    },
    {
      id: "q2",
      question: "In graph theory, which algorithm is optimal for finding single-source shortest paths in a weighted graph with non-negative edge weights?",
      options: ["Bellman-Ford Algorithm", "Dijkstra's Algorithm", "Floyd-Warshall Algorithm", "Kruskal's Algorithm"],
      correctAnswer: "Dijkstra's Algorithm",
      explanation: "Dijkstra's algorithm using a min-priority queue achieves O((V + E) log V) for graphs with non-negative weights.",
    },
    {
      id: "q3",
      question: "Which pattern is typically used in microservices architecture to maintain data consistency across distributed database services?",
      options: ["Saga Pattern", "Singleton Pattern", "Factory Pattern", "Observer Pattern"],
      correctAnswer: "Saga Pattern",
      explanation: "The Saga pattern coordinates transactions across microservices using a sequence of local transactions and compensating actions.",
    },
    {
      id: "q4",
      question: "What property distinguishes an AVL tree from a standard Binary Search Tree?",
      options: [
        "Nodes must have exactly two children",
        "The height difference between left and right subtrees of any node is at most 1",
        "Keys are sorted in reverse chronological order",
        "All leaf nodes are at identical depth",
      ],
      correctAnswer: "The height difference between left and right subtrees of any node is at most 1",
      explanation: "AVL trees strictly maintain a balance factor of -1, 0, or +1 at every node through tree rotations.",
    },
  ],
};

export const ACTIVE_QUIZ_SET: { title: string; timerMinutes: number; questions: TestQuestion[] } = {
  title: "Azure Cloud & AI Fundamentals Trivia",
  timerMinutes: 15,
  questions: [
    {
      id: "qz1",
      question: "Which Azure service provides a serverless event-driven compute platform?",
      options: ["Azure Virtual Machines", "Azure Functions", "Azure Blob Storage", "Azure SQL Database"],
      correctAnswer: "Azure Functions",
      explanation: "Azure Functions is a serverless compute service that lets you run event-triggered code without managing infrastructure.",
    },
    {
      id: "qz2",
      question: "What is the primary function of Azure Entra ID (formerly Azure AD)?",
      options: [
        "Cloud Data Warehousing",
        "Identity and Access Management (IAM)",
        "DNS Name Resolution",
        "Container Orchestration",
      ],
      correctAnswer: "Identity and Access Management (IAM)",
      explanation: "Azure Entra ID is Microsoft's cloud-based identity and access management service.",
    },
    {
      id: "qz3",
      question: "Which database service in Azure provides multi-model globally distributed NoSQL capabilities?",
      options: ["Azure SQL Managed Instance", "Azure Cosmos DB", "Azure Database for PostgreSQL", "Azure Cache for Redis"],
      correctAnswer: "Azure Cosmos DB",
      explanation: "Azure Cosmos DB is a fully managed globally distributed NoSQL and relational database service.",
    },
  ],
};

/**
 * Question Data Security: Returns public questions stripping answers and explanations.
 */
export function getPublicPlacementQuestions(): PublicTestQuestion[] {
  return ACTIVE_PLACEMENT_SET.questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
  }));
}

export function getPublicQuizQuestions(): PublicTestQuestion[] {
  return ACTIVE_QUIZ_SET.questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
  }));
}

/**
 * Server-side Score Calculation & Result Generation
 */
export function evaluatePlacementSubmission(
  studentOrUsername: StudentInfo | string,
  emailOrAnswers?: string | Record<string, string>,
  maybeAnswers?: Record<string, string>
): StudentResultReport {
  let studentInfo: StudentInfo | undefined;
  let username = "Student";
  let email = "";
  let userAnswers: Record<string, string> = {};

  if (typeof studentOrUsername === "object") {
    studentInfo = studentOrUsername;
    username = studentInfo.name;
    email = studentInfo.email;
    userAnswers = (emailOrAnswers as Record<string, string>) || {};
  } else {
    username = studentOrUsername;
    email = (emailOrAnswers as string) || "";
    userAnswers = maybeAnswers || {};
  }

  let correctCount = 0;
  const questions = ACTIVE_PLACEMENT_SET.questions;

  const details = questions.map((q) => {
    const selected = userAnswers[q.id] || "No Answer Selected";
    const isCorrect = selected === q.correctAnswer;
    if (isCorrect) correctCount++;

    return {
      questionId: q.id,
      questionText: q.question,
      userAnswer: selected,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const total = questions.length;
  const score = correctCount * 25;
  const percentage = Math.round((correctCount / total) * 100);

  return {
    attemptId: `placement-${Date.now()}`,
    username,
    email,
    studentInfo,
    department: studentInfo?.department,
    year: studentInfo?.year,
    section: studentInfo?.section,
    rollNumber: studentInfo?.rollNumber,
    testType: "Placement Questions",
    testTitle: ACTIVE_PLACEMENT_SET.title,
    score,
    totalQuestions: total,
    correctAnswersCount: correctCount,
    incorrectAnswersCount: total - correctCount,
    percentage,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    details,
  };
}

export function evaluateQuizSubmission(
  studentOrUsername: StudentInfo | string,
  emailOrAnswers?: string | Record<string, string>,
  maybeAnswers?: Record<string, string>
): StudentResultReport {
  let studentInfo: StudentInfo | undefined;
  let username = "Student";
  let email = "";
  let userAnswers: Record<string, string> = {};

  if (typeof studentOrUsername === "object") {
    studentInfo = studentOrUsername;
    username = studentInfo.name;
    email = studentInfo.email;
    userAnswers = (emailOrAnswers as Record<string, string>) || {};
  } else {
    username = studentOrUsername;
    email = (emailOrAnswers as string) || "";
    userAnswers = maybeAnswers || {};
  }

  let correctCount = 0;
  const questions = ACTIVE_QUIZ_SET.questions;

  const details = questions.map((q) => {
    const selected = userAnswers[q.id] || "No Answer Selected";
    const isCorrect = selected === q.correctAnswer;
    if (isCorrect) correctCount++;

    return {
      questionId: q.id,
      questionText: q.question,
      userAnswer: selected,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const total = questions.length;
  const score = Math.round((correctCount / total) * 100);
  const percentage = score;

  return {
    attemptId: `quiz-${Date.now()}`,
    username,
    email,
    studentInfo,
    department: studentInfo?.department,
    year: studentInfo?.year,
    section: studentInfo?.section,
    rollNumber: studentInfo?.rollNumber,
    testType: "General Quiz",
    testTitle: ACTIVE_QUIZ_SET.title,
    score,
    totalQuestions: total,
    correctAnswersCount: correctCount,
    incorrectAnswersCount: total - correctCount,
    percentage,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    details,
  };
}

export const HISTORY_PLACEMENT_SETS: HistorySet[] = [];

// Clean initial state (No fake sample student entries)
export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [];
