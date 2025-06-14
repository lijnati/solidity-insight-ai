
import React from "react";
import { cn } from "@/lib/utils";

/**
 * Props:
 * - code: the source code string
 * - vulnerabilities: array of { line: number, type: string, message: string, severity: string }
 * - explanations: array of { line: number, explanation: string }
 */
export type AnnotatedCodeBlockProps = {
  code: string;
  vulnerabilities?: Array<{
    line: number;
    type: string;
    message: string;
    severity: "low" | "medium" | "high";
  }>;
  explanations?: Array<{
    line: number;
    explanation: string;
  }>;
  className?: string;
};

const SEVERITY_COLORS = {
  high: "bg-red-200 dark:bg-red-800/50",
  medium: "bg-yellow-200 dark:bg-yellow-800/40",
  low: "bg-blue-100 dark:bg-blue-900/30",
};

/** Combines vulnerabilities and explanations for popup */
function annotateLines(
  code: string,
  vulnerabilities?: AnnotatedCodeBlockProps["vulnerabilities"],
  explanations?: AnnotatedCodeBlockProps["explanations"]
) {
  const lines = code.split("\n");
  const vulnMap = new Map<number, typeof vulnerabilities[0][]>();
  const explainMap = new Map<number, typeof explanations[0][]>();
  vulnerabilities?.forEach((v) => {
    vulnMap.set(v.line, [...(vulnMap.get(v.line) || []), v]);
  });
  explanations?.forEach((e) => {
    explainMap.set(e.line, [...(explainMap.get(e.line) || []), e]);
  });

  return lines.map((line, i) => {
    const n = i + 1;
    const vuln = vulnMap.get(n);
    const explanation = explainMap.get(n);

    const highlightClass = vuln
      ? SEVERITY_COLORS[vuln[0].severity]
      : explanation
      ? "bg-green-100 dark:bg-green-800/30"
      : "";

    const tooltip =
      (vuln
        ? vuln
            .map(
              (v) =>
                `<div>
                  <strong class='block text-sm'>[${v.severity.toUpperCase()}] ${v.type}</strong>
                  <span class='block text-xs'>${v.message}</span>
                 </div>`
            )
            .join("")
        : "") +
      (explanation
        ? explanation
            .map(
              (ex) =>
                `<div>
                  <span class='block text-xs'><strong>Explanation:</strong> ${ex.explanation}</span>
                 </div>`
            )
            .join("")
        : "");

    return {
      idx: i,
      value: line,
      highlightClass,
      tooltip: tooltip.length > 0 ? tooltip : null,
    };
  });
}

export const AnnotatedCodeBlock: React.FC<AnnotatedCodeBlockProps> = ({
  code,
  vulnerabilities,
  explanations,
  className,
}) => {
  const annotated = annotateLines(code, vulnerabilities, explanations);

  return (
    <pre
      className={cn(
        "rounded-lg overflow-x-auto text-sm font-mono relative border bg-muted",
        className
      )}
      style={{ padding: "0.75rem", margin: 0 }}
    >
      {annotated.map((ln, ix) => (
        <div
          key={ix}
          className={cn(
            "group flex items-start min-h-[1.4em] rounded transition-all hover:bg-accent/60 relative px-2",
            ln.highlightClass
          )}
          // Tooltip via native title for accessibility; you can replace with a custom tooltip if desired
          title={ln.tooltip ? undefined : undefined}
          data-tooltip-html={ln.tooltip || undefined}
          style={{ position: "relative" }}
        >
          {/* Line number */}
          <span
            className={cn(
              "select-none mr-3 text-xs text-muted-foreground",
              ln.highlightClass && "font-bold"
            )}
          >
            {ix + 1}
          </span>
          <span
            // Add a custom data-tooltip for later JS/Tooltip library (for now: just use native browser tooltip)
            className="flex-1 whitespace-pre-wrap break-words"
            // fallback: show all popups as browser tooltip on hover of code
            title={ln.tooltip ? ln.tooltip.replace(/<[^>]+>/g, "") : undefined}
            tabIndex={ln.tooltip ? 0 : -1}
            aria-describedby={ln.tooltip ? `anno-tip-${ix}` : undefined}
          >
            {ln.value || "\u200B"}
          </span>
        </div>
      ))}
    </pre>
  );
};

export default AnnotatedCodeBlock;
