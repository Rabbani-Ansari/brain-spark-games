import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, ArrowDown, AlertTriangle, Mic, MicOff } from "lucide-react"; // Added Mic imports
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import {
  Message,
  StudentContext,
  streamDoubtResponse,
  generateMessageId,
} from "@/services/doubtSolverService";
import { validateQuestion, isGreeting } from "@/services/subjectValidator";
import { useChapterProgress } from "@/contexts/ChapterProgressContext";

// Speech Recognition Type Definition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  context: StudentContext;
  initialMessage?: string;
  variant?: "fullscreen" | "bottomsheet" | "embedded";
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
  const [isListening, setIsListening] = useState(false); // Voice state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null); // Ref for recognition instance

  const { getChapterStats } = useChapterProgress();

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Default to English, could be dynamic

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => prev + (prev ? " " : "") + transcript);
      };
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

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
  }, [messages, showScrollButton, isListening]); // Scroll when listening status changes too

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle scroll
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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

    // Get stats
    const chapterStats = (context.subject && context.chapter)
      ? getChapterStats(context.subject, context.chapter)
      : undefined;

    // Merge stats into context for the API call
    const fullContext = {
      ...context,
      chapterStats: chapterStats
        ? {
          totalAttempts: chapterStats.totalAttempts,
          correctAnswers: chapterStats.correctAnswers,
          status: chapterStats.status
        }
        : undefined
    };

    const userMessage: Message = {
      id: generateMessageId(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Handle greetings with a friendly response (no API call)
    if (isGreeting(messageText)) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: "assistant",
          content: "Hi there! 👋 I'm your AI Tutor. What would you like to learn about today? Ask me any question about your studies!",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // Validate question before calling API
    const validation = validateQuestion(messageText, fullContext);
    if (!validation.isValid) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: "assistant",
          content: validation.rejectionMessage || "Please ask a study-related question!",
          timestamp: new Date(),
          isRejection: true,
        },
      ]);
      return;
    }

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
      context: fullContext,
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

  const getSuggestions = () => {
    if (context.subject === "Mathematics") return ["Explain Pythagoras theorem", "What is an integer?", "Formula for circle area"];
    if (context.subject === "Science") return ["Define Photosynthesis", "Newton's Laws", "Structure of Atom"];
    if (context.subject === "History") return ["Causes of WWII", "Mughal Empire", "Indian Independence"];
    return ["How do I study better?", "Make a study plan", "Quiz me!"];
  };

  const suggestions = getSuggestions();

  if (variant === "embedded") {
    return (
      <div className="flex flex-col h-full bg-card">
        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4"
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
                    className="block w-full max-w-xs mx-auto p-3 text-sm text-left bg-muted/50 border border-border rounded-xl hover:border-primary transition-colors"
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
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your doubt..."
              disabled={isLoading}
              className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
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
      </div>
    );
  }

  const containerClass =
    variant === "fullscreen"
      ? "fixed inset-0 z-50 bg-background flex flex-col"
      : "fixed inset-x-0 bottom-0 z-50 h-[70vh] bg-background rounded-t-3xl border-t border-border shadow-2xl flex flex-col";

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
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">AI Tutor</h2>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Grade {context.grade} • {context.board}
                  {context.subject && ` • ${context.subject}`}
                </p>
                {context.subject && context.chapter && (() => {
                  const stats = getChapterStats(context.subject, context.chapter);
                  if (stats.status !== 'Not Started') {
                    return (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${stats.status === 'Strong' ? 'bg-green-100 text-green-700' :
                        stats.status === 'Improving' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {stats.status}
                      </span>
                    )
                  }
                })()}
              </div>
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
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10"
          style={{ height: variant === "fullscreen" ? "calc(100vh - 140px)" : "calc(70vh - 140px)" }}
        >
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-secondary flex items-center justify-center animate-bounce-slow">
                <Sparkles className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Hi! I'm your AI Tutor 👋
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8">
                Ask me anything about your studies. I'll explain concepts in a
                way that's easy to understand!
              </p>

              {/* Initial Suggestions */}
              <div className="grid gap-2 max-w-sm mx-auto px-4">
                {suggestions.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="p-3 text-sm text-center bg-card border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-32 right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <ArrowDown className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background space-y-3">
          {/* Quick Suggestions Chips */}
          {messages.length > 0 && !isLoading && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1 bg-muted rounded-2xl border border-border focus-within:border-primary focus-within:bg-background transition-all flex items-center pr-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Ask your doubt..."}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none px-4 py-3 focus:ring-0 placeholder:text-muted-foreground text-foreground min-w-0"
              />

              {/* Voice Input Button */}
              <Button
                size="icon"
                variant="ghost"
                className={`h-9 w-9 rounded-full transition-all ${isListening ? "bg-red-500/10 text-red-500 animate-pulse hover:bg-red-500/20" : "text-muted-foreground hover:bg-muted-foreground/10"}`}
                onClick={toggleListening}
                disabled={isLoading}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>

            <Button
              onClick={() => handleSend()}
              disabled={(!inputValue.trim() && !isListening) || isLoading}
              className={`w-12 h-12 rounded-2xl shadow-lg transition-all ${inputValue.trim() ? "scale-100" : "scale-95 opacity-80"}`}
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
