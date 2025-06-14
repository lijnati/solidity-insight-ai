
// Solidity Audit Tool: Users can paste Solidity code or a GitHub link and get a code audit.

import React, { useState } from "react";
import { AuditInput } from "../components/AuditInput";
import { AuditResults, AuditResult, Vulnerability } from "../components/AuditResults";
import { Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";

const DUMMY_AUDIT_RESULT: AuditResult = {
  vulnerabilities: [
    {
      line: 7,
      type: "Missing Input Validation",
      message: "The set(uint x) function does not validate input. This can lead to unintended values being stored.",
      severity: "medium",
    },
    {
      line: 9,
      type: "Visibility",
      message: "The get() function is set as public, which may not be required if used internally.",
      severity: "low",
    }
  ],
  explanations: [
    { line: 1, explanation: "Specifies that this contract uses Solidity version 0.8.0 or greater." },
    { line: 3, explanation: "Declares a public unsigned integer variable named 'data'." },
    { line: 6, explanation: "Defines a function to set the value of 'data' without input validation." },
    { line: 9, explanation: "Defines a function to get the value of 'data'. The public visibility allows external calls."},
  ],
  suggestedFixes: [
    { line: 7, fix: "Add an input validation check, e.g., require(x > 0, 'Value must be positive');" }
  ],
};

export default function Index() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  function handleAudit({ mode, value }: { mode: "code" | "github"; value: string }) {
    setLoading(true);
    setResult(null);

    // Simulate AI call
    setTimeout(() => {
      setResult(DUMMY_AUDIT_RESULT);
      setLoading(false);
    }, 1500);
  }

  return (
    <div className="bg-background min-h-screen w-full pt-12 px-0 flex flex-col items-center">
      <Card className="w-full max-w-5xl mx-auto mb-10 shadow-2xl border-2 border-accent/30">
        <div className="p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Rocket size={32} className="text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Solidity Smart Contract Auditor</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Instantly audit your Solidity smart contracts for vulnerabilities. Paste your code or a public GitHub link, and get AI-powered findings, explanations, and suggested fixes.
          </p>
          <AuditInput loading={loading} onAudit={handleAudit} />
        </div>
      </Card>
      <div className="w-full max-w-5xl mx-auto">
        <AuditResults loading={loading} result={result} />
      </div>
      <footer className="mt-16 text-sm text-muted-foreground opacity-70 text-center">
        Built with ❤️ using Lovable, AI, Solidity, and React &nbsp;—&nbsp; Demo only, not for production audits.
      </footer>
    </div>
  );
}
