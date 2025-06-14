
import { AIVendor } from "./aiModels";
import { requestGeminiAudit } from "./geminiAudit";

// NOTE: Replace with your actual OpenAI key method, or use localStorage for frontend-only.
export function getStoredApiKey(vendor: AIVendor): string {
  try {
    return localStorage.getItem(`${vendor.toLowerCase()}-key`) || "";
  } catch {
    return "";
  }
}
export function setStoredApiKey(vendor: AIVendor, k: string) {
  try {
    localStorage.setItem(`${vendor.toLowerCase()}-key`, k);
  } catch {}
}

export async function requestOpenAIAudit({ apiKey, solidityCode, model }: { apiKey: string; solidityCode: string; model: string }) {
  // TODO: Replace with real OpenAI call logic.
  // For a real system, you should call your backend or Edge Function proxying OpenAI!
  await new Promise((res) => setTimeout(res, 1000));
  return {
    vulnerabilities: [
      { line: 3, type: "Reentrancy", message: "Sample OpenAI found reentrancy", severity: "high" }
    ],
    explanations: [{ line: 1, explanation: "OpenAI explanation sample." }],
    suggestedFixes: [{ line: 3, fix: "Use reentrancy guard." }]
  };
}
export async function requestClaudeAudit({ apiKey, solidityCode, model }: { apiKey: string; solidityCode: string; model: string }) {
  // TODO: Replace with real Claude call logic.
  await new Promise((res) => setTimeout(res, 1000));
  return {
    vulnerabilities: [
      { line: 5, type: "Arithmetic Overflow", message: "Sample Claude found overflow", severity: "medium" }
    ],
    explanations: [{ line: 1, explanation: "Claude explanation sample." }],
    suggestedFixes: [{ line: 5, fix: "Add SafeMath." }]
  };
}
export async function requestGrokAudit({ apiKey, solidityCode, model }: { apiKey: string; solidityCode: string; model: string }) {
  // TODO: Replace with real Grok call logic.
  await new Promise((res) => setTimeout(res, 1000));
  return {
    vulnerabilities: [
      { line: 9, type: "Gas Optimization", message: "Sample Grok found optimization", severity: "low" }
    ],
    explanations: [{ line: 2, explanation: "Grok explanation sample." }],
    suggestedFixes: [{ line: 9, fix: "Use calldata for params." }]
  };
}
