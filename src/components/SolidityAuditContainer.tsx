
import React, { useState, useRef } from "react";
import { AuditInput } from "./AuditInput";
import { AuditResults, AuditResult } from "./AuditResults";
import { Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { requestGeminiAudit } from "../utils/geminiAudit";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSaveAudit } from "@/hooks/useAudits";
import { fetchSolidityFilesFromGithubRepo, fetchFileContents } from "../utils/githubSolidity";
import GeminiModelSelect from "./GeminiModelSelect";

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

const GEMINI_MODELS = [
  {
    value: "gemini-1.5-flash-latest",
    label: "Gemini 1.5 Flash (fast, less accurate)",
  },
  {
    value: "gemini-1.5-pro-latest",
    label: "Gemini 1.5 Pro (better results)",
  },
];

function getStoredApiKey() {
  try {
    return localStorage.getItem("gemini-key") || "";
  } catch {
    return "";
  }
}

function setStoredApiKey(k: string) {
  try {
    localStorage.setItem("gemini-key", k);
  } catch {}
}

function getStoredGeminiModel() {
  try {
    return localStorage.getItem("gemini-model") || GEMINI_MODELS[0].value;
  } catch {
    return GEMINI_MODELS[0].value;
  }
}
function setStoredGeminiModel(model: string) {
  try {
    localStorage.setItem("gemini-model", model);
  } catch {}
}

export default function SolidityAuditContainer() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [multiResults, setMultiResults] = useState<{ [file: string]: AuditResult } | null>(null);
  const [fileOrder, setFileOrder] = useState<string[]>([]);
  const [showKeyInput, setShowKeyInput] = useState(() => !getStoredApiKey());
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [apiKeyInput, setApiKeyInput] = useState("");
  const keyInputRef = useRef<HTMLInputElement>(null);
  const [codeInput, setCodeInput] = useState("");
  const [geminiModel, setGeminiModel_] = useState(getStoredGeminiModel());
  const setGeminiModel = (val: string) => {
    setGeminiModel_(val);
    setStoredGeminiModel(val);
  };
  const { user } = useSupabaseAuth();
  const saveAudit = useSaveAudit();

  function handleSaveKey() {
    if (!apiKeyInput || apiKeyInput.length < 24) {
      toast({ title: "Invalid Gemini API Key", description: "Gemini API keys are typically at least 24 characters.", variant: "destructive" });
      keyInputRef.current?.focus();
      return;
    }
    setStoredApiKey(apiKeyInput);
    setApiKey(apiKeyInput);
    setShowKeyInput(false);
    toast({ title: "API Key Saved", description: "You can now audit contracts live with Gemini!", variant: "default" });
  }

  async function auditGithubRepo(val: string) {
    setLoading(true);
    setResult(null);
    setMultiResults(null);
    setFileOrder([]);
    try {
      const solFiles = await fetchSolidityFilesFromGithubRepo(val, 10);
      if (!solFiles.length) {
        setTimeout(() => {
          setLoading(false);
          toast({ title: "No Solidity files found", description: "The repository doesn't contain any .sol files.", variant: "destructive" });
        }, 900);
        return;
      }
      const filesWithContent = await fetchFileContents(solFiles);
      const totalLines = filesWithContent.reduce((sum, f) => sum + (f.content?.split("\n").length || 0), 0);
      if (totalLines > 2000) {
        setTimeout(() => {
          setLoading(false);
          toast({ title: "Repo too large", description: "Please audit a repo with fewer than 2000 total lines of Solidity code.", variant: "destructive" });
        }, 800);
        return;
      }
      const aggregated: { [path: string]: AuditResult } = {};
      for (let file of filesWithContent) {
        if (!file.content) continue;
        let audit: AuditResult;
        try {
          audit = await requestGeminiAudit({ apiKey, solidityCode: file.content, model: geminiModel });
        } catch {
          audit = DUMMY_AUDIT_RESULT;
        }
        aggregated[file.path] = audit;
        setMultiResults({ ...aggregated });
        setFileOrder(filesWithContent.map((f) => f.path));
      }
      setMultiResults(aggregated);
      setFileOrder(filesWithContent.map((f) => f.path));
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      toast({ title: "GitHub Audit Error", description: String(e?.message ?? e), variant: "destructive" });
    }
  }

  async function handleAudit({ mode, value }: { mode: "code" | "github"; value: string }) {
    setResult(null);
    setMultiResults(null);
    setFileOrder([]);
    if (mode === "github") {
      await auditGithubRepo(value);
      return;
    }
    setLoading(true);
    setCodeInput(value);
    if (!apiKey) {
      setTimeout(() => {
        setResult(DUMMY_AUDIT_RESULT);
        setLoading(false);
      }, 1500);
      toast({ title: "No API key set", description: "Please enter your Gemini key above for live auditing.", variant: "destructive" });
      return;
    }
    try {
      const audit = await requestGeminiAudit({
        apiKey,
        solidityCode: value,
        model: geminiModel,
      });
      setResult(audit);

      if (user && audit && mode === "code") {
        saveAudit.mutate({ code: value, report: audit });
      }
    } catch (e: any) {
      setResult(DUMMY_AUDIT_RESULT);
      toast({ title: "Gemini Error", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background min-h-screen w-full pt-3 px-0 flex flex-col items-center">
      <Card className="w-full max-w-5xl mx-auto mb-10 shadow-2xl border-2 border-accent/30">
        <div className="p-3 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Rocket size={32} className="text-primary mb-1 sm:mb-0" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Solidity Smart Contract Auditor</h1>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
            Instantly audit your Solidity smart contracts for vulnerabilities. Paste your code or a public GitHub link, and get AI-powered findings, explanations, and suggested fixes.
          </p>
          {/* Gemini Model Select */}
          <GeminiModelSelect
            models={GEMINI_MODELS}
            value={geminiModel}
            onChange={setGeminiModel}
          />
          {/* API Key Input */}
          {showKeyInput ? (
            <div className="bg-secondary border border-muted rounded-lg p-3 flex flex-col md:flex-row items-center gap-3 mb-2">
              <input
                ref={keyInputRef}
                type="password"
                className="border rounded px-3 py-2 w-full md:w-96 font-mono text-sm"
                placeholder="Enter your Gemini API Key"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                autoFocus
              />
              <button
                className="bg-primary text-primary-foreground px-5 py-2 rounded shadow font-semibold hover:bg-primary/80 transition w-full md:w-auto"
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
          <AuditInput
            loading={loading}
            onAudit={handleAudit}
          />
        </div>
      </Card>
      <div className="w-full max-w-5xl mx-auto px-0 sm:px-2">
        <AuditResults
          loading={loading}
          result={result}
          code={codeInput}
          multiResults={multiResults}
          fileOrder={fileOrder}
        />
      </div>
      <footer className="mt-10 mb-3 text-xs sm:text-sm text-muted-foreground opacity-70 text-center px-2">
        Built with ❤️ using Lovable, AI, Solidity, and React &nbsp;—&nbsp; Demo only, not for production audits.
      </footer>
    </div>
  );
}
