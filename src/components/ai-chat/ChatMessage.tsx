import { motion } from "framer-motion";
import { User, Sparkles, Copy, Check, AlertTriangle, Volume2, VolumeX, StopCircle } from "lucide-react"; // Added Volume imports
import { useState, useEffect } from "react";
import { Message } from "@/services/doubtSolverService";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export const ChatMessage = ({ message, isStreaming }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === "user";
  const isRejection = message.isRejection;

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isSpeaking]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = 'en-US'; // Could be dynamic based on detected language
    utterance.rate = 1; /* Speed */
    utterance.pitch = 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Simple markdown-like formatting
  const formatContent = (content: string) => {
    return content
      .split("\n")
      .map((line, i) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
        // Checkmarks
        line = line.replace(/✅/g, '<span class="text-green-500">✅</span>');
        line = line.replace(/❌/g, '<span class="text-red-500">❌</span>');
        // Bullet points
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return `<li class="ml-4">${line.substring(2)}</li>`;
        }
        return line;
      })
      .join("<br/>");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
            ? "bg-primary text-primary-foreground"
            : isRejection
              ? "bg-amber-500/20 text-amber-500"
              : "bg-gradient-secondary text-secondary-foreground"
          }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : isRejection ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>

      {/* Message */}
      <div
        className={`flex-1 max-w-[85%] ${isUser ? "text-right" : "text-left"}`}
      >
        {/* Image preview if present */}
        {message.imageUrl && (
          <div className={`mb-2 ${isUser ? "flex justify-end" : ""}`}>
            <div className="relative inline-block">
              <img
                src={message.imageUrl}
                alt="Uploaded content"
                className="max-w-[200px] max-h-[200px] rounded-xl border border-border object-cover"
              />
              {message.imageMode && (
                <span className={`absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded-full ${
                  message.imageMode === "solve" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-amber-500 text-white"
                }`}>
                  {message.imageMode === "solve" ? "Solve" : "Guide me"}
                </span>
              )}
            </div>
          </div>
        )}

        <div
          className={`inline-block p-3 rounded-2xl ${isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : isRejection
                ? "bg-amber-500/10 border border-amber-500/30 rounded-bl-md"
                : "bg-card border border-border rounded-bl-md"
            }`}
        >
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />

          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-current ml-1"
            />
          )}
        </div>

        {/* Actions for AI messages */}
        {!isUser && !isStreaming && message.content && !isRejection && (
          <div className="mt-1 flex gap-2">
            <button
              onClick={handleSpeak}
              className={`flex items-center gap-1 text-xs transition-colors ${isSpeaking ? "text-primary animate-pulse" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {isSpeaking ? (
                <>
                  <StopCircle className="w-3 h-3" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3" />
                  Read
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
