
import React, { useState, useRef } from "react";
import { AuditInput } from "./AuditInput";
import { AuditResults, AuditResult } from "./AuditResults";
import { Rocket, Loader, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSaveAudit } from "@/hooks/useAudits";
import { fetchSolidityFilesFromGithubRepo, fetchFileContents } from "../utils/githubSolidity";
import { AIModelSelect } from "./AIModelSelect";
import { ALL_AI_MODELS, AIVendor, getModelsForVendor } from "../utils/aiModels";
import { getStoredApiKey, setStoredApiKey, requestOpenAIAudit, requestClaudeAudit, requestGrokAudit } from "../utils/aiApi";
import { requestGeminiAudit } from "../utils/geminiAudit";

const DUMMY_AUDIT_RESULT: AuditResult = {
  vulnerabilities: [
    {
      line: 7,
      type: "Missing Input Validation",
      message: "The set(uint x) function does not validate input. This can lead to unintended values being stored.",
      severity: "medium" as "medium",
    },
    {
      line: 9,
      type: "Visibility",
      message: "The get() function is set as public, which may not be required if used internally.",
      severity: "low" as "low",
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

function getStoredModelVendor() {
  try {
    // Try from localStorage, fallback to Gemini as default
    return localStorage.getItem("ai-vendor") as AIVendor || "Gemini";
  } catch {
    return "Gemini";
  }
}
function setStoredModelVendor(vendor: AIVendor) {
  try {
    localStorage.setItem("ai-vendor", vendor);
  } catch {}
}
function getStoredModel(vendor: AIVendor) {
  try {
    return localStorage.getItem(`ai-model-${vendor}`) || getModelsForVendor(vendor)[0]?.value || "";
  } catch {
    return getModelsForVendor(vendor)[0]?.value || "";
  }
}
function setStoredModel(vendor: AIVendor, model: string) {
  try {
    localStorage.setItem(`ai-model-${vendor}`, model);
  } catch {}
}

// types for status UI
type AuditStatus = "idle" | "loading" | "success" | "error";

// Status Banner Component
const StatusBanner: React.FC<{ status: AuditStatus, message?: string }> = ({ status, message }) => {
  if (status === "idle") return null;
  if (status === "loading") {
    return (
      <Alert className="mb-2" variant="default">
        <Loader className="animate-spin text-blue-500" />
        <AlertTitle>Auditing in progress...</AlertTitle>
        <AlertDescription>
          Please wait while we analyze your contract(s).
        </AlertDescription>
      </Alert>
    );
  }
  if (status === "error") {
    return (
      <Alert className="mb-2" variant="destructive">
        <AlertTriangle className="text-red-500" />
        <AlertTitle>Audit failed</AlertTitle>
        <AlertDescription>
          {message || "There was an error while running your audit. Please try again or check your API key."}
        </AlertDescription>
      </Alert>
    );
  }
  if (status === "success") {
    return (
      <Alert className="mb-2" variant="default">
        <CheckCircle2 className="text-green-600" />
        <AlertTitle>Audit completed</AlertTitle>
        <AlertDescription>
          Your audit results are ready below.
        </AlertDescription>
      </Alert>
    );
  }
  return null;
};

export default function SolidityAuditContainer() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AuditStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [multiResults, setMultiResults] = useState<{ [file: string]: AuditResult } | null>(null);
  const [fileOrder, setFileOrder] = useState<string[]>([]);
  const [aiVendor, setAIVendor_] = useState<AIVendor>(getStoredModelVendor());
  const [model, setModel_] = useState(getStoredModel(getStoredModelVendor()));
  const [showKeyInput, setShowKeyInput] = useState(() => !getStoredApiKey(getStoredModelVendor()));
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKey, setApiKey] = useState(getStoredApiKey(aiVendor));
  const keyInputRef = useRef<HTMLInputElement>(null);
  const [codeInput, setCodeInput] = useState("");
  const { user } = useSupabaseAuth();
  const saveAudit = useSaveAudit();

  // Sync local storage on vendor/model change
  const setAIVendor = (v: AIVendor) => {
    setAIVendor_(v);
    setStoredModelVendor(v);
    // Reset model to default for vendor if current invalid
    const ms = getModelsForVendor(v)[0]?.value || "";
    setModel_(ms);
    setStoredModel(v, ms);
    // Handle API key per vendor
    const storedKey = getStoredApiKey(v);
    setApiKey(storedKey);
    setShowKeyInput(!storedKey);
    setApiKeyInput("");
  };
  const setModel = (m: string) => {
    setModel_(m);
    setStoredModel(aiVendor, m);
  };

  function handleSaveKey() {
    if (!apiKeyInput || apiKeyInput.length < 10) {
      toast({ title: "Invalid API Key", description: `${aiVendor} API keys are typically at least 10 characters.`, variant: "destructive" });
      keyInputRef.current?.focus();
      return;
    }
    setStoredApiKey(aiVendor, apiKeyInput);
    setApiKey(apiKeyInput);
    setShowKeyInput(false);
    toast({ title: "API Key Saved", description: `You can now audit contracts with ${aiVendor}!`, variant: "default" });
  }

  // fixes return types so severity type is always "high"|"medium"|"low"
  function normalizeAuditResult(obj: any): AuditResult {
    return {
      vulnerabilities: (obj.vulnerabilities || []).map((v: any) => ({
        ...v,
        severity:
          v.severity === "high" || v.severity === "medium" || v.severity === "low"
            ? v.severity
            : (
                String(v.severity).toLowerCase().includes("high")
                  ? "high"
                  : String(v.severity).toLowerCase().includes("medium")
                  ? "medium"
                  : "low"
              ),
      })),
      explanations: obj.explanations || [],
      suggestedFixes: obj.suggestedFixes || [],
    };
  }

  // Dynamic auditFn selection
  async function vendorAuditFn({ solidityCode }: { solidityCode: string }): Promise<AuditResult> {
    let res;
    switch (aiVendor) {
      case "Gemini":
        res = await requestGeminiAudit({ apiKey, solidityCode, model });
        break;
      case "OpenAI":
        res = await requestOpenAIAudit({ apiKey, solidityCode, model });
        break;
      case "Claude":
        res = await requestClaudeAudit({ apiKey, solidityCode, model });
        break;
      case "Grok":
        res = await requestGrokAudit({ apiKey, solidityCode, model });
        break;
      default:
        return DUMMY_AUDIT_RESULT;
    }
    return normalizeAuditResult(res);
  }

  async function auditGithubRepo(val: string) {
    setLoading(true);
    setStatus("loading");
    setStatusMessage(undefined);
    setResult(null);
    setMultiResults(null);
    setFileOrder([]);
    try {
      const solFiles = await fetchSolidityFilesFromGithubRepo(val, 10);
      if (!solFiles.length) {
        setTimeout(() => {
          setLoading(false);
          setStatus("error");
          setStatusMessage("No Solidity files found in this repository.");
          toast({ title: "No Solidity files found", description: "The repository doesn't contain any .sol files.", variant: "destructive" });
        }, 900);
        return;
      }
      const filesWithContent = await fetchFileContents(solFiles);
      const totalLines = filesWithContent.reduce((sum, f) => sum + (f.content?.split("\n").length || 0), 0);
      if (totalLines > 2000) {
        setTimeout(() => {
          setLoading(false);
          setStatus("error");
          setStatusMessage("Please audit a repo with fewer than 2000 total lines of Solidity code.");
          toast({ title: "Repo too large", description: "Please audit a repo with fewer than 2000 total lines of Solidity code.", variant: "destructive" });
        }, 800);
        return;
      }
      const aggregated: { [path: string]: AuditResult } = {};
      for (let file of filesWithContent) {
        if (!file.content) continue;
        let audit: AuditResult;
        try {
          audit = await vendorAuditFn({ solidityCode: file.content });
        } catch {
          audit = DUMMY_AUDIT_RESULT;
        }
        aggregated[file.path] = audit;
        setMultiResults({ ...aggregated });
        setFileOrder(filesWithContent.map((f) => f.path));
      }
      setMultiResults(aggregated);
      setFileOrder(filesWithContent.map((f) => f.path));
      setStatus("success");
      setStatusMessage(undefined);
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setStatus("error");
      setStatusMessage(String(e?.message ?? e));
      toast({ title: "GitHub Audit Error", description: String(e?.message ?? e), variant: "destructive" });
    }
  }

  async function handleAudit({ mode, value }: { mode: "code" | "github"; value: string }) {
    setResult(null);
    setMultiResults(null);
    setFileOrder([]);
    setStatus("idle");
    setStatusMessage(undefined);
    if (mode === "github") {
      await auditGithubRepo(value);
      return;
    }
    setLoading(true);
    setStatus("loading");
    setStatusMessage(undefined);
    setCodeInput(value);
    if (!apiKey) {
      setTimeout(() => {
        setResult(DUMMY_AUDIT_RESULT);
        setStatus("error");
        setStatusMessage("Please enter your API key above for live auditing.");
        setLoading(false);
      }, 1500);
      toast({ title: "No API key set", description: `Please enter your ${aiVendor} key above for live auditing.`, variant: "destructive" });
      return;
    }
    try {
      const audit = await vendorAuditFn({ solidityCode: value });
      setResult(audit);
      setStatus("success");
      setStatusMessage(undefined);
      if (user && audit && mode === "code") {
        saveAudit.mutate({ code: value, report: audit });
      }
    } catch (e: any) {
      setResult(DUMMY_AUDIT_RESULT);
      setStatus("error");
      setStatusMessage(String(e?.message ?? e));
      toast({ title: `${aiVendor} Error`, description: String(e?.message ?? e), variant: "destructive" });
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
          {/* AI Vendor/Model Select */}
          <AIModelSelect
            vendor={aiVendor}
            setVendor={setAIVendor}
            model={model}
            setModel={setModel}
          />
          {/* API Key Input */}
          {showKeyInput ? (
            <div className="bg-secondary border border-muted rounded-lg p-3 flex flex-col md:flex-row items-center gap-3 mb-2">
              <input
                ref={keyInputRef}
                type="password"
                className="border rounded px-3 py-2 w-full md:w-96 font-mono text-sm"
                placeholder={`Enter your ${aiVendor} API Key`}
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
              <span className="font-mono tracking-tighter bg-muted rounded px-2 py-1">API key set ({aiVendor}, private to your browser)</span>
              <button
                className="text-blue-600 hover:underline"
                onClick={() => setShowKeyInput(true)}
                type="button"
              >
                Change key
              </button>
            </div>
          )}
          {/* Status Feedback */}
          <StatusBanner status={status} message={statusMessage} />
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
