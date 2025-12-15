export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isRejection?: boolean;
}

export interface StudentContext {
  grade: string;
  board: string;
  language: string;
  subject?: string;
  currentQuestion?: string;
}

const DOUBT_SOLVER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/doubt-solver`;

export async function streamDoubtResponse({
  doubt,
  context,
  messageHistory,
  onDelta,
  onDone,
  onError,
}: {
  doubt: string;
  context: StudentContext;
  messageHistory: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const response = await fetch(DOUBT_SOLVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        doubt,
        grade: context.grade,
        board: context.board,
        language: context.language,
        subject: context.subject,
        currentQuestion: context.currentQuestion,
        messageHistory: messageHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok || !response.body) {
      if (response.status === 429) {
        onError("Too many requests. Please wait a moment and try again.");
        return;
      }
      if (response.status === 402) {
        onError("AI credits exhausted. Please try again later.");
        return;
      }
      onError("Failed to get response. Please try again.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Flush remaining buffer
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Doubt solver error:", error);
    onError("Connection failed. Please check your internet and try again.");
  }
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
