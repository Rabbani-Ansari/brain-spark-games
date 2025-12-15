// @ts-ignore
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
  chapter?: string;
  chapterStats?: { totalAttempts: number; correctAnswers: number; status: string };
  currentQuestion?: string;
  messageHistory?: Message[];
}

declare const Deno: any;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { doubt, grade, board, language, subject, chapter, chapterStats, currentQuestion, messageHistory = [] }: DoubtRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing doubt for Grade ${grade}, ${board}, ${language}:`, doubt);

    // Build context-aware system prompt
    let systemPrompt = `You are a friendly and expert AI Tutor for a Grade ${grade} student studying under the ${board} board. Language: ${language}.\n`;

    if (chapter) {
      systemPrompt += `\nCONTEXT: CHAPTER "${chapter}" (${subject})\n`;
      if (chapterStats) {
        systemPrompt += `STUDENT STATUS: ${chapterStats.status} (Attempts: ${chapterStats.totalAttempts}, Correct: ${chapterStats.correctAnswers})\n`;
        if (chapterStats.status === 'Weak') {
          systemPrompt += `COACHING: The student is struggling with this chapter. Be extra patient, break down concepts into very small steps, and provide easier examples.\n`;
        } else if (chapterStats.status === 'Improving') {
          systemPrompt += `COACHING: The student is improving. Encourage them and slowly introduce slightly harder concepts.\n`;
        } else if (chapterStats.status === 'Strong') {
          systemPrompt += `COACHING: The student has mastered this chapter! Congratulate them and feel free to discuss advanced applications or suggest moving to the next chapter.\n`;
        }
      }
      systemPrompt += `STRICT RULE: You are currently teaching ONLY the chapter "${chapter}".\n`;
      systemPrompt += `- Do NOT explain concepts from other chapters or advanced topics not in this chapter.\n`;
      systemPrompt += `- If the student asks a question that belongs to a different chapter, politely DECLINE to answer directly.\n`;
      systemPrompt += `- Instead, explain that the conceptual belongs to another chapter and ask if they would like to switch contexts.\n`;
      systemPrompt += `- Use specific terminology and examples from the ${board} syllabus for "${chapter}".\n`;
      systemPrompt += `- Focus on step-by-step explanations suitable for Grade ${grade}.\n`;
    } else if (subject) {
      systemPrompt += `\nCONTEXT: SUBJECT "${subject}" (Full Syllabus)\n`;
      systemPrompt += `- You may answer questions from ANY chapter in the ${subject} syllabus for Grade ${grade}.\n`;
      systemPrompt += `- Keep explanations simple, exam-focused, and age-appropriate.\n`;
      systemPrompt += `- If a concept is too advanced (e.g., from Class 11/12), briefly mention it's for higher classes and stick to the Grade ${grade} level explanation.\n`;
    } else {
      systemPrompt += `\nCONTEXT: General Learning (Grade ${grade})\n`;
      systemPrompt += `- Help the student with their studies across subjects.\n`;
    }

    if (currentQuestion) {
      systemPrompt += `\nCURRENT ACTIVITY: The student is looking at this question: "${currentQuestion}"\n`;
    }

    systemPrompt += `\nGENERAL RULES:
1. Explain concepts in SIMPLE language appropriate for Grade ${grade}
2. Use REAL-WORLD EXAMPLES and STORIES to make concepts memorable
3. Keep explanations concise but thorough
4. Use bullet points for key concepts
5. Provide 1-2 practice examples when relevant or asked
6. Be encouraging, supportive, and never discourage the student
7. Do NOT hallucinate syllabus content. If unsure, ask clarifying questions.
    
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