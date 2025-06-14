
export async function requestOpenAIAudit({
  apiKey,
  solidityCode,
}: {
  apiKey: string;
  solidityCode: string;
}): Promise<{
  vulnerabilities: { line: number; type: string; message: string; severity: "high" | "medium" | "low" }[];
  explanations: { line: number; explanation: string }[];
  suggestedFixes: { line: number; fix: string }[];
}> {
  const prompt = `
You are a Solidity smart contract auditor.
Analyze this Solidity contract for security vulnerabilities.
Provide:
1. Vulnerabilities as a JSON array with fields: line, type, message, severity ("high"|"medium"|"low").
2. Line-by-line explanations as a JSON array: { line, explanation }
3. Suggested fixes as a JSON array: { line, fix }

Solidity code:
\`\`\`
${solidityCode}
\`\`\`
Return your answer as a JSON object with these properties: vulnerabilities, explanations, suggestedFixes. No commentary or formatting.
  `.trim();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ],
      temperature: 0.0,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    throw new Error("Failed to call OpenAI: " + response.statusText);
  }

  const data = await response.json();
  // Extract the first assistant message's content and parse JSON
  const text = data.choices?.[0]?.message?.content ?? "";
  try {
    // Try normal parse first, if it fails, try to extract JSON with regex
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]+\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Could not parse OpenAI audit response");
  }
}
