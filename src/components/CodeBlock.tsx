
import React, { useMemo } from "react";
import hljs from "highlight.js/lib/core";
import "highlight.js/styles/github-dark.css";
// Import Solidity highlighting language from highlightjs-solidity
import hljsDefineSolidity from "highlightjs-solidity";

// Register the Solidity language
hljsDefineSolidity(hljs);

export type CodeBlockProps = {
  code: string;
  highlightLines?: number[];
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, highlightLines }) => {
  const { highlightedCode, lines } = useMemo(() => {
    // Highlight code using highlight.js
    const result = hljs.highlight(code, { language: "solidity" });
    const codeLines = result.value.split(/\r?\n/);
    return { highlightedCode: codeLines, lines: code.split(/\r?\n/) };
  }, [code]);

  return (
    <pre className="rounded-lg overflow-x-auto bg-[#21272c] border border-accent relative my-2 shadow-inner text-sm font-mono">
      <code>
        {highlightedCode.map((line, i) => {
          const currentLine = i + 1;
          const isVulnerable = highlightLines?.includes(currentLine);
          return (
            <div
              key={i}
              className={`flex min-w-0 items-center ${
                isVulnerable
                  ? "bg-red-700/30 border-l-4 border-red-400/70"
                  : "border-l-4 border-transparent"
              }`}
              data-line={currentLine}
            >
              <span
                className={`select-none w-10 text-right pr-3 pl-2 opacity-60 ${
                  isVulnerable ? "text-red-400 font-semibold" : ""
                }`}
                style={{ userSelect: "none" }}
              >
                {currentLine}
              </span>
              <span
                className="block max-w-full whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: line || "\u200B" }}
              />
            </div>
          );
        })}
      </code>
    </pre>
  );
};

export default CodeBlock;
