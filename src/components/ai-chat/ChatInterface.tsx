import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import {
  Message,
  StudentContext,
  streamDoubtResponse,
  generateMessageId,
} from "@/services/doubtSolverService";

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  context: StudentContext;
  initialMessage?: string;
  variant?: "fullscreen" | "bottomsheet";
}

export const ChatInterface = ({
  isOpen,
  onClose,
  context,
  initialMessage,
  variant = "fullscreen",
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle initial message
  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      setInputValue(initialMessage);
      // Auto-send after a brief delay
      setTimeout(() => {
        handleSend(initialMessage);
      }, 300);
    }
  }, [isOpen, initialMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollButton]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Create placeholder for assistant message
    const assistantId = generateMessageId();
    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === "assistant" && lastMsg.id === assistantId) {
          return prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          {
            id: assistantId,
            role: "assistant" as const,
            content: assistantContent,
            timestamp: new Date(),
          },
        ];
      });
    };

    await streamDoubtResponse({
      doubt: messageText,
      context,
      messageHistory: messages,
      onDelta: updateAssistant,
      onDone: () => setIsLoading(false),
      onError: (error) => {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            role: "assistant",
            content: `❌ ${error}`,
            timestamp: new Date(),
          },
        ]);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const containerClass =
    variant === "fullscreen"
      ? "fixed inset-0 z-50 bg-background"
      : "fixed inset-x-0 bottom-0 z-50 h-[70vh] bg-background rounded-t-3xl border-t border-border shadow-2xl";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: variant === "bottomsheet" ? 100 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: variant === "bottomsheet" ? 100 : 0 }}
        transition={{ type: "spring", damping: 25 }}
        className={containerClass}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">AI Tutor</h2>
              <p className="text-xs text-muted-foreground">
                Grade {context.grade} • {context.board}
                {context.subject && ` • ${context.subject}`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ height: variant === "fullscreen" ? "calc(100vh - 140px)" : "calc(70vh - 140px)" }}
        >
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-secondary flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Hi! I'm your AI Tutor 👋
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Ask me anything about your studies. I'll explain concepts in a
                way that's easy to understand!
              </p>

              {/* Suggested prompts */}
              <div className="mt-6 space-y-2">
                {[
                  "Explain photosynthesis simply",
                  "How do fractions work?",
                  "What is the water cycle?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="block w-full max-w-xs mx-auto p-3 text-sm text-left bg-card border border-border rounded-xl hover:border-primary transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-24 right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
            >
              <ArrowDown className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your doubt..."
              disabled={isLoading}
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              className="w-12 h-12"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
