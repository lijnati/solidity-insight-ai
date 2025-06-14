
export type AIVendor = "Gemini" | "OpenAI" | "Claude" | "Grok";
export interface AIModel {
  vendor: AIVendor;
  value: string;
  label: string;
}

// Extend as needed
export const ALL_AI_MODELS: AIModel[] = [
  // Gemini
  { vendor: "Gemini", value: "gemini-1.5-flash-latest", label: "Gemini 1.5 Flash (fast, less accurate)" },
  { vendor: "Gemini", value: "gemini-1.5-pro-latest", label: "Gemini 1.5 Pro (better results)" },
  // OpenAI
  { vendor: "OpenAI", value: "gpt-4o-mini", label: "OpenAI GPT-4o Mini" },
  { vendor: "OpenAI", value: "gpt-4o", label: "OpenAI GPT-4o" },
  // Claude
  { vendor: "Claude", value: "claude-opus-4-20250514", label: "Claude 4 Opus" },
  { vendor: "Claude", value: "claude-sonnet-4-20250514", label: "Claude 4 Sonnet" },
  // Grok
  { vendor: "Grok", value: "grok-1.5", label: "Grok 1.5" },
];

export const getModelsForVendor = (vendor: AIVendor) =>
  ALL_AI_MODELS.filter((m) => m.vendor === vendor);

export const VENDORS: { label: string; value: AIVendor }[] = [
  { label: "Gemini", value: "Gemini" },
  { label: "OpenAI", value: "OpenAI" },
  { label: "Claude", value: "Claude" },
  { label: "Grok", value: "Grok" },
];
