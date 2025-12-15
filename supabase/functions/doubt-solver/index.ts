import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DoubtRequest {
  doubt: string;
  grade: string;
  board: string;
  language: string;
  subject?: string;
  currentQuestion?: string;
  messageHistory?: Message[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { doubt, grade, board, language, subject, currentQuestion, messageHistory = [] }: DoubtRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing doubt for Grade ${grade}, ${board}, ${language}:`, doubt);

    // Build context-aware system prompt
    const systemPrompt = `You are an expert AI tutor helping a Grade ${grade} student studying under the ${board} board in ${language}.
${subject ? `Subject: ${subject}` : ""}
${currentQuestion ? `\nCurrent question being discussed: "${currentQuestion}"` : ""}

Your role:
1. Explain concepts in SIMPLE language appropriate for Grade ${grade}
2. Use REAL-WORLD EXAMPLES and STORIES to make concepts memorable
3. Keep explanations concise but thorough
4. Use bullet points for key concepts
5. Provide 1-2 practice examples when relevant
6. Be encouraging and supportive

Format your responses with:
- **Bold** for important terms
- Bullet points for lists
- Clear paragraph breaks
- Simple language suitable for the student's grade level

Keep responses under 400 words unless the topic requires more detail.`;

    // Build messages array
    const messages: Message[] = [
      { role: "user" as const, content: systemPrompt },
      ...messageHistory.slice(-10), // Keep last 10 messages for context
      { role: "user" as const, content: doubt }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in doubt-solver:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
