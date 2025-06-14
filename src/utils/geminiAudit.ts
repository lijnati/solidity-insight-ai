
export async function requestGeminiAudit({
  apiKey,
  solidityCode,
  model = "gemini-1.5-flash-latest",
}: {
  apiKey: string;
  solidityCode: string;
  model?: string;
}): Promise<{
  vulnerabilities: { line: number; type: string; message: string; severity: "high" | "medium" | "low" }[];
  explanations: { line: number; explanation: string }[];
  suggestedFixes: { line: number; fix: string }[];
}> {
  // Use the selected Gemini model in the endpoint URL
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const prompt = `
You are a Solidity smart contract auditor.
Analyze the Solidity contract below for security vulnerabilities.

Return ONLY a JSON object with:
{
  vulnerabilities: Array<{ line: number, type: string, message: string, severity: "high"|"medium"|"low" }>,
  explanations: Array<{ line: number, explanation: string }>,
  suggestedFixes: Array<{ line: number, fix: string }>
}

Solidity code:
\`\`\`solidity
${solidityCode}
\`\`\`
`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(
    `${endpoint}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to call Gemini: " + (await res.text()));
  }
  const data = await res.json();

  // Gemini's response is typically {candidates:[{content:{parts:[{text:"..."}]}}]}
  // So we need to parse that output to JSON.

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.content?.parts?.[0]?.data ||
    "";

  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]+\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Could not parse Gemini audit response");
  }
}

