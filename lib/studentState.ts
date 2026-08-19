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

export const HISTORY_PLACEMENT_SETS: HistorySet[] = [
  {
    id: "hist-32",
    weekName: "Placement Questions — Week 32",
    title: "Graph Algorithms & Memory Management",
    completedDate: "2026-08-08",
    questionCount: 4,
    topic: "Graphs & Memory",
    questions: [
      {
        id: "h32-q1",
        question: "What is the primary advantage of using a Min-Heap over an unsorted array for implementing Dijkstra's Shortest Path Algorithm?",
        options: [
          "O(1) time complexity for edge relaxation",
          "O(log V) time complexity for extracting the minimum distance vertex",
          "Eliminates the need for dynamic memory allocation",
          "Guarantees linear time complexity O(V + E) for all weighted graphs"
        ],
        correctAnswer: "O(log V) time complexity for extracting the minimum distance vertex",
        explanation: "A min-priority queue (min-heap) reduces the vertex extraction time from O(V) scan time to O(log V), bringing the total time complexity down from O(V^2) to O((V + E) log V)."
      },
      {
        id: "h32-q2",
        question: "Which memory allocation error occurs when a C++ program repeatedly allocates dynamic memory using 'new' without calling 'delete'?",
        options: [
          "Stack Overflow",
          "Memory Leak",
          "Dangling Pointer",
          "Segmentation Fault"
        ],
        correctAnswer: "Memory Leak",
        explanation: "Failing to release dynamically allocated heap memory prevents the operating system from reclaiming unused RAM, leading to a memory leak."
      },
      {
        id: "h32-q3",
        question: "In Tarjan's algorithm for strongly connected components (SCC), what property does the 'low-link' value of a node represent?",
        options: [
          "The shortest distance from the source vertex in BFS traversal",
          "The lowest node reachable from that node using at most one back-edge",
          "The total number of outgoing edges in the adjacency list",
          "The execution depth of the topological sort recursion"
        ],
        correctAnswer: "The lowest node reachable from that node using at most one back-edge",
        explanation: "The low-link value tracks the smallest discovery time reachable from the current node's subtree via back-edges during DFS."
      },
      {
        id: "h32-q4",
        question: "What is the space complexity of Kosaraju's algorithm for finding Strongly Connected Components in a graph with V vertices and E edges?",
        options: [
          "O(V)",
          "O(V + E)",
          "O(V^2)",
          "O(E log V)"
        ],
        correctAnswer: "O(V + E)",
        explanation: "Kosaraju's algorithm requires O(V + E) space to construct the transposed graph and perform two passes of Depth-First Search."
      }
    ]
  },
  {
    id: "hist-31",
    weekName: "Placement Questions — Week 31",
    title: "Bit Manipulation & System Design Basics",
    completedDate: "2026-08-01",
    questionCount: 3,
    topic: "Bitwise Ops",
    questions: [
      {
        id: "h31-q1",
        question: "Which bitwise operation efficiently determines if a positive integer N is a power of 2?",
        options: [
          "(N & (N - 1)) == 0",
          "(N | (N + 1)) == 0",
          "(N ^ (N >> 1)) == 1",
          "(N & ~N) == N"
        ],
        correctAnswer: "(N & (N - 1)) == 0",
        explanation: "If N is a power of 2, it has exactly one set bit (e.g., 1000). N-1 flips that bit and sets all lower bits (0111). Performing bitwise AND yields 0."
      },
      {
        id: "h31-q2",
        question: "Which architectural strategy handles high read throughput by distributing queries across multiple read-only database replicas?",
        options: [
          "Database Sharding",
          "Read Replication / Read-Write Splitting",
          "Two-Phase Commit Protocol",
          "Write-Ahead Logging"
        ],
        correctAnswer: "Read Replication / Read-Write Splitting",
        explanation: "Directing read operations to follower database replicas offloads the primary write instance and increases throughput exponentially."
      },
      {
        id: "h31-q3",
        question: "What is the primary role of a Bloom Filter in distributed caching systems?",
        options: [
          "To provide exact key-value lookup with zero false positives",
          "To rapidly test set membership with low memory usage and no false negatives",
          "To automatically compress JSON payload payloads over HTTP",
          "To balance network traffic evenly across microservice clusters"
        ],
        correctAnswer: "To rapidly test set membership with low memory usage and no false negatives",
        explanation: "A Bloom filter uses bit arrays to quickly verify if an element is definitely NOT in a set, avoiding unnecessary expensive database queries."
      }
    ]
  },
  {
    id: "hist-30",
    weekName: "Placement Questions — Week 30",
    title: "Object Oriented Design Patterns & C++ OOP",
    completedDate: "2026-07-25",
    questionCount: 3,
    topic: "OOP Patterns",
    questions: [
      {
        id: "h30-q1",
        question: "Which Design Pattern decouples an abstraction from its implementation so that the two can vary independently?",
        options: [
          "Bridge Pattern",
          "Adapter Pattern",
          "Decorator Pattern",
          "Facade Pattern"
        ],
        correctAnswer: "Bridge Pattern",
        explanation: "The Bridge pattern uses encapsulation, aggregation, and inheritance to separate abstract logic from implementation classes."
      },
      {
        id: "h30-q2",
        question: "What happens when a C++ class defines a virtual destructor?",
        options: [
          "It prevents the class from being inherited by child classes",
          "It ensures the derived class destructor is invoked when deleting an object through a base class pointer",
          "It forces the compiler to inline all member functions",
          "It automatically initializes all dynamic memory fields to nullptr"
        ],
        correctAnswer: "It ensures the derived class destructor is invoked when deleting an object through a base class pointer",
        explanation: "Declaring a virtual destructor guarantees that deleting a derived object via a base class pointer triggers proper cleanup in both derived and base classes."
      },
      {
        id: "h30-q3",
        question: "In the SOLID design principles, what does the 'L' (Liskov Substitution Principle) state?",
        options: [
          "Objects in a program should be replaceable with instances of their subtypes without altering program correctness",
          "Classes should be open for extension but closed for modification",
          "High-level modules should not depend on low-level modules",
          "Interfaces should be fine-grained and client-specific"
        ],
        correctAnswer: "Objects in a program should be replaceable with instances of their subtypes without altering program correctness",
        explanation: "Liskov Substitution Principle ensures sub-classes honor the interface contracts of their super-classes without unexpected side effects."
      }
    ]
  }
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: "Karthik Raja", score: 96, percentage: 96, week: "Week 33" },
  { rank: 2, username: "Ananya Ramesh", score: 92, percentage: 92, week: "Week 33" },
  { rank: 3, username: "Vikram Seth", score: 88, percentage: 88, week: "Week 33" },
  { rank: 4, username: "Divya Nair", score: 84, percentage: 84, week: "Week 33" },
  { rank: 5, username: "Rahul Sundaram", score: 80, percentage: 80, week: "Week 33" },
];
