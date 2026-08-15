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
}

/**
 * Thin wrapper around Together's OpenAI-compatible chat endpoint.
 * No SDK — just fetch, since this runs in the Deno edge runtime.
 */
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
      temperature: 0.2,
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

/**
 * Together responses occasionally wrap JSON in ```json fences even when
 * asked not to. Strip those before parsing rather than trusting
 * response_format, which isn't consistently honored across models.
 */
export function safeParseJsonArray(raw: string): unknown[] {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "");
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error("Failed to parse JSON from Together response:", raw);
    return [];
  }
}