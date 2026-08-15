const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions";

// Override via `supabase secrets set TOGETHER_MODEL=...` if you want a
// different model without redeploying code.
const TOGETHER_MODEL =
  Deno.env.get("TOGETHER_MODEL") ?? "meta-llama/Llama-3.3-70B-Instruct-Turbo";

interface TogetherMessage {
  role: "system" | "user";
  content: string;
}

interface CallOptions {
  maxTokens?: number;
  temperature?: number;
}

export async function callTogether(
  messages: TogetherMessage[],
  options: CallOptions = {}
): Promise<string> {
  const apiKey = Deno.env.get("TOGETHER_API_KEY");
  if (!apiKey) {
    throw new Error(
      "TOGETHER_API_KEY is not set. Run: supabase secrets set TOGETHER_API_KEY=<key>"
    );
  }

  const res = await fetch(TOGETHER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: TOGETHER_MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 500,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Together AI request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Together AI returned an unexpected response shape");
  }
  return content;
}

function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "");
}

export function safeParseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(stripFences(raw));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    console.error("Failed to parse JSON object from Together response:", raw);
    return null;
  }
}