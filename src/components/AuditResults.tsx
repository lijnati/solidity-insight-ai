
import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Wrench, Info, Code } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import CodeBlock from "./CodeBlock";

export type Vulnerability = {
  line: number;
  type: string;
  message: string;
  severity: "high" | "medium" | "low";
};

export type AuditResult = {
  vulnerabilities: Vulnerability[];
  explanations: { line: number; explanation: string }[];
  suggestedFixes: { line: number; fix: string }[];
};

// Severity styles
const severityColor = {
  high: "border-red-500",
  medium: "border-yellow-400",
  low: "border-emerald-500",
};

const severityIcon = {
  high: <AlertTriangle className="text-red-500 mr-2" size={20} />,
  medium: <AlertTriangle className="text-yellow-500 mr-2" size={20} />,
  low: <CheckCircle2 className="text-emerald-500 mr-2" size={20} />,
};

type AuditResultsProps = {
  code?: string;
  result?: AuditResult | null;
  loading?: boolean;
};

export const AuditResults: React.FC<AuditResultsProps> = ({ code, result, loading }) => {
  // We'll add an expanded state for accordion if needed in the future.
  // Highlight vulnerability lines in code
  const vulnLines =
    result?.vulnerabilities?.map((v) => v.line) ?? [];

  if (loading) {
    // Loading skeleton, only basic for now
    return (
      <div className="min-h-[320px]">
        <div className="h-8 bg-muted rounded w-1/3 mb-2 animate-pulse" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded animate-pulse w-5/6" />
          ))}
        </div>
      </div>
    );
  }
  if (!result) {
    return (
      <div className="text-muted-foreground flex flex-col items-center py-16">
        <Info size={32} className="mb-2" />
        <span>Audit results will appear here.</span>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="flex flex-col gap-8 w-full" collapsible>
      {/* Solidity Code Viewer */}
      {code && (
        <Card className="p-4 shadow border-2 border-primary/10">
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Code className="text-orange-400" /> Solidity Code Audited
          </h3>
          <div>
            <CodeBlock code={code} highlightLines={vulnLines} />
          </div>
        </Card>
      )}

      {/* Vulnerabilities */}
      <AccordionItem value="vulnerabilities" className="rounded-lg overflow-hidden">
        <AccordionTrigger className="bg-primary/10 px-5 py-3 font-semibold hover-scale flex items-center gap-2 text-lg">
          <AlertTriangle className="text-orange-500" /> Detected Vulnerabilities
        </AccordionTrigger>
        <AccordionContent>
          <Card className="p-6 shadow border-2 border-primary/30 rounded-t-none rounded-b-lg">
            {result.vulnerabilities.length === 0 ? (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="mr-2" /> No vulnerabilities detected.
              </div>
            ) : (
              <ul className="space-y-3">
                {result.vulnerabilities.map((vuln, idx) => (
                  <li
                    key={idx}
                    className={`flex items-top border-l-4 pl-3 pb-2 ${severityColor[vuln.severity]}`}
                  >
                    {severityIcon[vuln.severity]}
                    <div>
                      <span className="font-semibold">{vuln.type}</span>{" "}
                      <span className="text-sm text-muted-foreground italic">
                        [line {vuln.line}]
                      </span>
                      <div>{vuln.message}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </AccordionContent>
      </AccordionItem>

      {/* Explanation */}
      <AccordionItem value="explanations" className="rounded-lg overflow-hidden">
        <AccordionTrigger className="bg-primary/10 px-5 py-3 font-semibold hover-scale flex items-center gap-2 text-lg">
          <Info className="text-blue-500" /> Line-by-Line Explanation
        </AccordionTrigger>
        <AccordionContent>
          <Card className="p-6 shadow border-2 border-muted rounded-t-none rounded-b-lg">
            <div className="max-h-64 overflow-y-auto">
              <ol className="space-y-2">
                {result.explanations.map((exp, idx) => (
                  <li key={idx} className="pl-2 pb-2 border-l-2 border-accent">
                    <span className="font-mono font-bold text-xs pr-2">
                      Line {exp.line}:
                    </span>
                    <span>{exp.explanation}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </AccordionContent>
      </AccordionItem>

      {/* Suggested Fixes */}
      <AccordionItem value="fixes" className="rounded-lg overflow-hidden">
        <AccordionTrigger className="bg-primary/10 px-5 py-3 font-semibold hover-scale flex items-center gap-2 text-lg">
          <Wrench className="text-emerald-500" /> Suggested Fixes
        </AccordionTrigger>
        <AccordionContent>
          <Card className="p-6 shadow border-2 border-accent rounded-t-none rounded-b-lg">
            <ul className="space-y-2">
              {result.suggestedFixes.length === 0 ? (
                <li className="text-muted-foreground">No fixes necessary.</li>
              ) : (
                result.suggestedFixes.map((fix, idx) => (
                  <li key={idx} className="pl-2 border-l-2 border-emerald-600">
                    <span className="font-mono font-bold text-xs pr-2">
                      Line {fix.line}:
                    </span>
                    <span>{fix.fix}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default AuditResults;
