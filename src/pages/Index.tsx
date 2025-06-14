
// Solidity Audit Tool: Users can paste Solidity code or a GitHub link and get a code audit.

import React, { useState, useRef } from "react";
import { AuditInput } from "../components/AuditInput";
import { AuditResults, AuditResult } from "../components/AuditResults";
import { Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requestOpenAIAudit } from "@/utils/openaiAudit";
import { toast } from "@/hooks/use-toast";

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

function getStoredApiKey() {
  try {
    return localStorage.getItem("openai-key") || "";
  } catch {
    return "";
  }
}

function setStoredApiKey(k: string) {
  try {
    localStorage.setItem("openai-key", k);
  } catch {}
}

export default function Index() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(() => !getStoredApiKey());
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [apiKeyInput, setApiKeyInput] = useState("");
  const keyInputRef = useRef<HTMLInputElement>(null);

  function handleSaveKey() {
    if (!apiKeyInput.startsWith("sk-") || apiKeyInput.length < 24) {
      toast({ title: "Invalid OpenAI API Key", description: "Keys start with 'sk-' and should be at least 24 chars.", variant: "destructive" });
      keyInputRef.current?.focus();
      return;
    }
    setStoredApiKey(apiKeyInput);
    setApiKey(apiKeyInput);
    setShowKeyInput(false);
    toast({ title: "API Key Saved", description: "You can now audit contracts live!", variant: "default" });
  }

  async function handleAudit({ mode, value }: { mode: "code" | "github"; value: string }) {
    setLoading(true);
    setResult(null);

    // Only support code mode in this initial step for OpenAI
    if (mode !== "code") {
      setTimeout(() => {
        toast({ title: "GitHub input not supported", description: "Live audits only work for pasted code at this time.", variant: "destructive" });
        setResult(DUMMY_AUDIT_RESULT);
        setLoading(false);
      }, 1500);
      return;
    }
    if (!apiKey) {
      setTimeout(() => {
        setResult(DUMMY_AUDIT_RESULT);
        setLoading(false);
      }, 1500);
      toast({ title: "No API key set", description: "Please enter your OpenAI key above for live auditing.", variant: "destructive" });
      return;
    }
    try {
      const audit = await requestOpenAIAudit({
        apiKey,
        solidityCode: value
      });
      setResult(audit);
    } catch (e: any) {
      setResult(DUMMY_AUDIT_RESULT); // fallback to dummy
      toast({ title: "OpenAI Error", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
          {/* API Key Input */}
          {showKeyInput ? (
            <div className="bg-secondary border border-muted rounded-lg p-4 flex flex-col md:flex-row items-center gap-3 mb-2">
              <input
                ref={keyInputRef}
                type="password"
                className="border rounded px-3 py-2 w-full md:w-96 font-mono"
                placeholder="Enter your OpenAI API Key (starts with sk-...)"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                autoFocus
              />
              <button
                className="bg-primary text-primary-foreground px-5 py-2 rounded shadow font-semibold hover:bg-primary/80 transition"
                onClick={handleSaveKey}
                type="button"
              >
                Save Key
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-0">
              <span className="font-mono tracking-tighter bg-muted rounded px-2 py-1">API key set (private to your browser)</span>
              <button
                className="text-blue-600 hover:underline"
                onClick={() => setShowKeyInput(true)}
                type="button"
              >
                Change key
              </button>
            </div>
          )}
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
