/**
 * Robust RFC 4180 compliant CSV parser and utilities for MCC Question sets.
 * Handles multiline quoted fields, escaped quotes (""), commas within cells,
 * whitespace, indentation, brackets, and the Boolean 'Is Code' column.
 */

export interface ParsedQuestionRow {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  isCode: boolean;
}

export interface CSVParseResult {
  success: boolean;
  error?: string;
  questions: ParsedQuestionRow[];
}

/**
 * Parses full CSV string into a 2D string array: string[][]
 * Supports multiline quoted cells, escaped double quotes, and CRLF / LF line endings.
 */
export function parseCSV(text: string): string[][] {
  if (!text) return [];

  // Strip Byte Order Mark (BOM) if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        // Any character inside quotes is preserved literally (newlines, tabs, spaces, commas)
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
        i++;
        continue;
      } else if (char === "\r") {
        if (nextChar === "\n") {
          i++; // Consume \r of \r\n
        }
        currentRow.push(currentField);
        currentField = "";
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else if (char === "\n") {
        currentRow.push(currentField);
        currentField = "";
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push any pending field and row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Validates and normalizes the 'Is Code' value case-insensitively.
 * Accepts: 'true', 'false', 'TRUE', 'FALSE', 'True', 'False', etc.
 */
export function normalizeIsCode(rawValue: any): { isValid: boolean; value: boolean } {
  if (typeof rawValue === "boolean") {
    return { isValid: true, value: rawValue };
  }
  if (typeof rawValue !== "string") {
    return { isValid: false, value: false };
  }
  const trimmed = rawValue.trim().toLowerCase();
  if (trimmed === "true") {
    return { isValid: true, value: true };
  }
  if (trimmed === "false") {
    return { isValid: true, value: false };
  }
  return { isValid: false, value: false };
}

/**
 * Validates CSV header and rows for questions, enforcing the new 'Is Code' column.
 */
export function validateAndParseQuestionsCSV(csvText: string): CSVParseResult {
  const allRows = parseCSV(csvText);

  // Filter out any completely blank trailing rows
  const rows = allRows.filter((row) => row.some((col) => col.trim().length > 0));

  if (rows.length <= 1) {
    return {
      success: false,
      error: "The uploaded CSV file is empty or missing data rows.",
      questions: [],
    };
  }

  // Validate Header row
  const headerCols = rows[0].map((c) => c.trim().toLowerCase());
  const hasQuestion = headerCols.some((c) => c.includes("question"));
  const hasChoice1 = headerCols.some((c) => c.includes("choice 1"));
  const hasChoice2 = headerCols.some((c) => c.includes("choice 2"));
  const hasAnswer = headerCols.some((c) => c.includes("answer"));
  const hasIsCode = headerCols.some(
    (c) => c === "is code" || c === "iscode" || c === "is_code" || c.includes("is code")
  );

  if (!hasQuestion || !hasChoice1 || !hasChoice2 || !hasAnswer || !hasIsCode) {
    return {
      success: false,
      error:
        "CSV headers missing required columns. Must include: Question, Choice 1, Choice 2, Choice 3, Choice 4, Answer, Explanation, Is Code.",
      questions: [],
    };
  }

  const questions: ParsedQuestionRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const rowNumber = r + 1; // 1-based index matching user's spreadsheet row

    if (cols.length < 8) {
      return {
        success: false,
        error: `Row ${rowNumber}: Missing required columns. Expected 8 columns (Question, Choice 1, Choice 2, Choice 3, Choice 4, Answer, Explanation, Is Code), found ${cols.length}.`,
        questions: [],
      };
    }

    if (cols.length > 8 && cols.slice(8).some((c) => c.trim().length > 0)) {
      return {
        success: false,
        error: `Row ${rowNumber}: Found ${cols.length} columns instead of 8. If your question or code contains commas, please ensure the cell is enclosed in quotation marks.`,
        questions: [],
      };
    }

    const qText = cols[0];
    if (!qText || !qText.trim()) {
      return {
        success: false,
        error: `Row ${rowNumber}: Question text cannot be empty.`,
        questions: [],
      };
    }

    const choice1 = cols[1];
    const choice2 = cols[2];
    if (!choice1 || !choice1.trim() || !choice2 || !choice2.trim()) {
      return {
        success: false,
        error: `Row ${rowNumber}: Choice 1 and Choice 2 cannot be empty.`,
        questions: [],
      };
    }

    const choice3 = cols[3]?.trim() || "N/A";
    const choice4 = cols[4]?.trim() || "N/A";
    const answer = cols[5]?.trim() || choice1.trim();
    const explanation =
      cols[6]?.trim() ||
      `Standard technical assessment explanation for question ${questions.length + 1}.`;

    const rawIsCode = cols[7] ?? "";
    const isCodeCheck = normalizeIsCode(rawIsCode);

    if (!isCodeCheck.isValid) {
      const displayVal = rawIsCode.trim() ? ` "${rawIsCode.trim()}"` : "";
      return {
        success: false,
        error: `Row ${rowNumber}: Invalid or missing "Is Code" value${displayVal}. Must be "true" or "false".`,
        questions: [],
      };
    }

    questions.push({
      question: qText.replace(/\r\n/g, "\n"),
      options: [choice1.trim(), choice2.trim(), choice3, choice4],
      correctAnswer: answer,
      explanation,
      isCode: isCodeCheck.value,
    });
  }

  return {
    success: true,
    questions,
  };
}

/**
 * Generates an RFC 4180 valid Sample CSV string containing both normal text and multiline code questions.
 */
export function generateValidSampleCSV(activityType: string = "Quiz"): string {
  const isPlacement = activityType.toLowerCase().includes("placement");

  return [
    "Question,Choice 1,Choice 2,Choice 3,Choice 4,Answer,Explanation,Is Code",
    // Row 2: Normal text question (Is Code = false)
    `"What is the primary architectural purpose of using microservices in modern cloud applications?","Decoupled, independently deployable and scalable services","Monolithic shared in-memory database storage","Elimination of all network latency and protocols","Exclusive dependency on single-threaded execution","Decoupled, independently deployable and scalable services","Microservices decompose applications into modular, independently deployable services that communicate via lightweight APIs.",false`,
    // Row 3: Multiline Coding Question with JavaScript indentation and brackets (Is Code = true)
    `"What will be the output of the following JavaScript code snippet?

function calculateTotal() {
    let count = 0;
    for (let i = 0; i < 3; i++) {
        count += i * 2;
    }
    return count;
}
console.log(calculateTotal());","6","3","0","9","6","During iteration: i=0 -> count=0; i=1 -> count=2; i=2 -> count=2+4=6. Final return value is 6.",true`,
    // Row 4: Multiline Coding Question with Python indentation (Is Code = true)
    `"Given the following Python function, what is the return value of mystery([1, 2, 3, 4, 5])?

def mystery(nums):
    result = []
    for x in nums:
        if x % 2 == 0:
            result.append(x ** 2)
    return result","[4, 16]","[1, 9, 25]","[2, 4]","[4, 8, 16]","[4, 16]","The function filters for even numbers (2 and 4) and squares them (4 and 16).",true`,
    // Row 5: Normal text question (Is Code = false)
    `"Which protocol operates at the Transport Layer (Layer 4) of the OSI model and provides connection-oriented, reliable data transmission?","TCP","UDP","IP","HTTP","TCP","TCP (Transmission Control Protocol) is connection-oriented and ensures reliable, ordered delivery of data packets.",false`,
    // Row 6: Multiline Coding Question with C++ pointers (Is Code = true)
    `"What is the output of the following C++ code snippet?

#include <iostream>
using namespace std;

int main() {
    int arr[] = {10, 20, 30, 40};
    int *ptr = arr;
    cout << *(ptr + 2) << endl;
    return 0;
}","30","20","40","Garbage value","30","Pointer arithmetic (ptr + 2) offsets the pointer by 2 elements, pointing to arr[2] which holds 30.",true`,
    // Row 7: Normal text question (Is Code = false)
    `"In relational databases, what does the ACID acronym stand for?","Atomicity, Consistency, Isolation, Durability","Availability, Consistency, Integrity, Durability","Accuracy, Concurrency, Isolation, Dependability","Atomicity, Concurrency, Indexing, Distribution","Atomicity, Consistency, Isolation, Durability","ACID represents the four key properties that guarantee database transactions are processed reliably.",false`,
  ].join("\r\n");
}
