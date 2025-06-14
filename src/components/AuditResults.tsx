
import React from "react";
import { AlertTriangle, CheckCircle2, Wrench, Info, Code } from "lucide-react";
import { Card } from "@/components/ui/card";

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
  high: "text-red-600",
  medium: "text-yellow-600",
  low: "text-green-600",
};

const severityIcon = {
  high: <AlertTriangle className="text-red-600 mr-2" size={20} />,
  medium: <AlertTriangle className="text-yellow-600 mr-2" size={20} />,
  low: <CheckCircle2 className="text-green-600 mr-2" size={20} />,
};

type AuditResultsProps = {
  code?: string;
  result?: AuditResult | null;
  loading?: boolean;
};

export const AuditResults: React.FC<AuditResultsProps> = ({ code, result, loading }) => {
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
    <div className="flex flex-col gap-8 w-full">
      {/* Solidity Code Viewer */}
      {code && (
        <Card className="p-4 shadow border-2 border-primary/10">
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Code className="text-orange-400" /> Solidity Code Audited
          </h3>
          <pre className="whitespace-pre-wrap bg-[#21272c] rounded font-mono text-white text-sm p-4 overflow-x-auto">
            {code}
          </pre>
        </Card>
      )}

      {/* Vulnerabilities */}
      <Card className="p-6 shadow border-2 border-primary/30">
        <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <AlertTriangle className="text-orange-500" /> Detected Vulnerabilities
        </h4>
        {result.vulnerabilities.length === 0 ? (
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="mr-2" /> No vulnerabilities detected.
          </div>
        ) : (
          <ul className="space-y-3">
            {result.vulnerabilities.map((vuln, idx) => (
              <li key={idx} className="flex items-center">
                {severityIcon[vuln.severity]}
                <span className={`font-semibold pr-2 ${severityColor[vuln.severity]}`}>
                  {vuln.type}
                </span>
                <span className="text-sm text-muted-foreground italic pr-2">
                  [line {vuln.line}]
                </span>
                <span>{vuln.message}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Explanation */}
      <Card className="p-6 shadow border-2 border-muted">
        <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Info className="text-blue-500" /> Line-by-Line Explanation
        </h4>
        <ol className="space-y-2">
          {result.explanations.map((exp, idx) => (
            <li key={idx} className="pl-2 border-l-2 border-accent">
              <span className="font-mono font-bold text-xs pr-2">
                Line {exp.line}:
              </span>
              <span>{exp.explanation}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* Suggested Fixes */}
      <Card className="p-6 shadow border-2 border-accent">
        <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Wrench className="text-emerald-500" /> Suggested Fixes
        </h4>
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
    </div>
  );
};

export default AuditResults;
