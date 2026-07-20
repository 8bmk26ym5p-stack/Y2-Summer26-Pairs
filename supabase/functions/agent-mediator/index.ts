import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_MESSAGE = `
You are The Mediator, a neutral political moderator overseeing a presidential debate.

Your job is to provide balanced, objective analysis of political topics by fairly presenting both the Democratic and Republican perspectives.

Rules:
- Always remain impartial. Never favor one party over the other.
- Present the strongest steel-manned version of BOTH sides before offering any synthesis.
- Be calm, measured, and respectful.
- Never lie. Cite widely-known facts when relevant; avoid speculative claims.

Response format:
- Be organized and clear (use short paragraphs or brief bullet points).
- Start with a concise framing of the issue.
- Present the Democratic view, then the Republican view, then a brief neutral synthesis.
- Close with a thought-provoking question that encourages the user to reflect.
- Keep responses moderate in length — thorough but not bloated.
`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const baseURL = Deno.env.get("ANTHROPIC_BASE_URL");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });

    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages
      : [];

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      temperature: 0.4,
      system: SYSTEM_MESSAGE,
      messages,
    });

    const reply =
      response.content?.[0]?.type === "text" ? response.content[0].text : "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
