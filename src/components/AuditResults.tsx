import React from "react";
import { AlertTriangle, CheckCircle2, Wrench, Info, Code, Download, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

// Type for multi-file result:
export type AggregatedAuditResult = {
  [filePath: string]: AuditResult;
};

type MultiAuditResultsProps = {
  multiResults?: AggregatedAuditResult | null;
  fileOrder?: string[];
  loading?: boolean;
};

// UI for displaying multi-file aggregated results:
const MultiAuditResults: React.FC<MultiAuditResultsProps> = ({ multiResults, fileOrder = [], loading }) => {
  if (loading) {
    return (
      <div className="min-h-[320px]">
        <div className="h-8 bg-muted rounded w-1/3 mb-2 animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse w-5/6" />
        ))}
      </div>
    );
  }
  if (!multiResults || fileOrder.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center py-16">
        <Info size={32} className="mb-2" />
        <span>Audit results will appear here.</span>
      </div>
    );
  }

  // Show summary (files analyzed, total vulnerabilities)
  const totalVulns = fileOrder.reduce(
    (sum, fp) => sum + (multiResults[fp]?.vulnerabilities?.length || 0),
    0
  );

  return (
    <div className="flex flex-col gap-10 w-full">
      <div className="mb-3">
        <span className="font-semibold">{fileOrder.length}</span> Solidity file{fileOrder.length !== 1 ? "s" : ""} analyzed.<br />
        <span className={totalVulns === 0 ? "text-green-600" : "text-red-600 font-semibold"}>
          {totalVulns} vulnerabilit{totalVulns === 1 ? "y" : "ies"} detected.
        </span>
      </div>
      {fileOrder.map((filePath) => {
        const file = multiResults[filePath];
        if (!file) return null;
        return (
          <Card key={filePath} className="p-6 shadow border-2 border-primary/30 mb-2">
            <h3 className="text-md font-bold flex items-center mb-2 gap-2">
              <FileText className="text-primary" size={18} />
              <span className="truncate max-w-[60vw]">{filePath}</span>
            </h3>
            {/* Vulnerabilities */}
            <div className="mb-2">
              <h4 className="text-base font-semibold flex items-center gap-2 mb-2">
                <AlertTriangle className="text-orange-500" /> Vulnerabilities
              </h4>
              {file.vulnerabilities.length === 0 ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle2 className="mr-2" /> No vulnerabilities detected.
                </div>
              ) : (
                <ul className="space-y-2">
                  {file.vulnerabilities.map((vuln, idx) => (
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
            </div>
            {/* Explanations */}
            <div className="mb-2">
              <h4 className="text-base font-semibold flex items-center gap-2 mb-2">
                <Info className="text-blue-500" /> Line-by-Line Explanation
              </h4>
              <ol className="space-y-2">
                {file.explanations.map((exp, idx) => (
                  <li key={idx} className="pl-2 border-l-2 border-accent">
                    <span className="font-mono font-bold text-xs pr-2">Line {exp.line}:</span>
                    <span>{exp.explanation}</span>
                  </li>
                ))}
              </ol>
            </div>
            {/* Suggested Fixes */}
            <div>
              <h4 className="text-base font-semibold flex items-center gap-2 mb-2">
                <Wrench className="text-emerald-500" /> Suggested Fixes
              </h4>
              <ul className="space-y-1">
                {file.suggestedFixes.length === 0 ? (
                  <li className="text-muted-foreground">No fixes necessary.</li>
                ) : (
                  file.suggestedFixes.map((fix, idx) => (
                    <li key={idx} className="pl-2 border-l-2 border-emerald-600">
                      <span className="font-mono font-bold text-xs pr-2">Line {fix.line}:</span>
                      <span>{fix.fix}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

type AuditResultsProps = {
  code?: string;
  result?: AuditResult | null;
  loading?: boolean;
};

// MODIFY export: Add multi-file support to AuditResults
type ExtendedAuditResultsProps = {
  code?: string;
  result?: AuditResult | null;
  multiResults?: AggregatedAuditResult | null;
  fileOrder?: string[];
  loading?: boolean;
};

export const AuditResults: React.FC<ExtendedAuditResultsProps> = (props) => {
  // Show multi-file results if present
  if (props.multiResults && props.fileOrder && props.fileOrder.length > 0) {
    return (
      <MultiAuditResults
        multiResults={props.multiResults}
        fileOrder={props.fileOrder}
        loading={props.loading}
      />
    );
  }
  // Fallback: old single-file results
  // Just call single file AuditResults render logic here:
  const { code, result, loading } = props as AuditResultsProps;

  // Download handler
  const handleDownloadReport = () => {
    if (!result) return;
    const dataForExport = {
      code: code || "",
      vulnerabilities: result.vulnerabilities,
      explanations: result.explanations,
      suggestedFixes: result.suggestedFixes,
      generatedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataForExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // File name: "solidity-audit-report-YYYYMMDD-HHMMSS.json"
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fileName = `solidity-audit-report-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 250);
  };

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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Code className="text-orange-400" /> Solidity Code Audited
            </h3>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleDownloadReport}
              size="sm"
              title="Download report as JSON"
            >
              <Download size={18} />
              Download Report
            </Button>
          </div>
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
