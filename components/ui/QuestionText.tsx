import React from "react";

interface QuestionTextProps {
  text: string;
  isCode?: boolean;
  className?: string;
  codeClassName?: string;
}

/**
 * QuestionText renders question text according to whether it is a coding question.
 *
 * When isCode is true:
 * - Preserves all line breaks, indentation, leading spaces, and tabs
 * - Renders in a dedicated monospace container with horizontal scroll handling (whitespace-pre overflow-x-auto)
 * - Ensures long lines do not break overall page layout
 *
 * When isCode is false:
 * - Retains standard text rendering
 */
export const QuestionText: React.FC<QuestionTextProps> = ({
  text,
  isCode = false,
  className = "",
  codeClassName = "",
}) => {
  const content = text || "";

  if (isCode) {
    return (
      <div className={`w-full max-w-full my-1.5 ${className}`}>
        <pre
          className={`p-3.5 sm:p-4 rounded-xl bg-[#030712] border border-white/10 text-[#38BDF8] font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto whitespace-pre tab-4 shadow-inner selection:bg-[#0078D4]/40 ${codeClassName}`}
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            tabSize: 4,
          }}
        >
          <code>{content}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={`leading-relaxed whitespace-pre-line ${className}`}>
      {content}
    </div>
  );
};
