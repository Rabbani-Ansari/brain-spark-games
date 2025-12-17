import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, ArrowDown, AlertTriangle, Mic, MicOff, ImagePlus, Camera, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import { ChatHistory } from "./ChatHistory";
import {
  Message,
  StudentContext,
  streamDoubtResponse,
  generateMessageId,
} from "@/services/doubtSolverService";
import { validateQuestion, isGreeting } from "@/services/subjectValidator";
import { useChapterProgress } from "@/contexts/ChapterProgressContext";
import {
  createConversation,
  updateConversationTitle,
  saveMessage,
  getConversationMessages,
} from "@/services/chatHistoryService";
import { supabase } from "@/integrations/supabase/client";

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

type ImageMode = "solve" | "guide";

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
  const [isListening, setIsListening] = useState(false);
  
  // Image upload state
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<ImageMode>("solve");
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  // Chat history state
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getChapterStats } = useChapterProgress();

  // Check for authenticated user
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  // Image upload handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPendingImage(base64);
      setShowModeSelector(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      
      // Create video element to capture frame
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      
      // Create canvas and capture frame
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      
      // Stop stream
      stream.getTracks().forEach(track => track.stop());
      
      // Get base64
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      setPendingImage(base64);
      setShowModeSelector(true);
    } catch (error) {
      console.error("Camera error:", error);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  const clearPendingImage = () => {
    setPendingImage(null);
    setShowModeSelector(false);
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

  // Start a new conversation
  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
  };

  // Load a conversation from history
  const loadConversation = async (convId: string) => {
    const msgs = await getConversationMessages(convId);
    setMessages(msgs);
    setConversationId(convId);
    setShowHistory(false);
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim() || (pendingImage ? "Please help me with this" : "");
    if ((!messageText && !pendingImage) || isLoading) return;

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
      imageUrl: pendingImage || undefined,
      imageMode: pendingImage ? imageMode : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    clearPendingImage(); // Clear image after sending

    // Create conversation if first message and user is logged in
    let activeConvId = conversationId;
    if (!activeConvId && userId && messages.length === 0) {
      activeConvId = await createConversation(userId, context.subject, context.chapter);
      if (activeConvId) {
        setConversationId(activeConvId);
        // Set title from first message
        await updateConversationTitle(activeConvId, messageText);
      }
    }

    // Save user message to database
    if (activeConvId) {
      await saveMessage(activeConvId, userMessage);
    }

    // Handle greetings with a friendly response (no API call)
    if (isGreeting(messageText)) {
      const greetingResponse: Message = {
        id: generateMessageId(),
        role: "assistant",
        content: "Hi there! 👋 I'm your AI Tutor. What would you like to learn about today? Ask me any question about your studies!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, greetingResponse]);
      if (activeConvId) await saveMessage(activeConvId, greetingResponse);
      return;
    }

    // Skip validation for image uploads (let AI analyze the image)
    if (!pendingImage) {
      // Validate question before calling API
      const validation = validateQuestion(messageText, fullContext);
      if (!validation.isValid) {
        const rejectionResponse: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: validation.rejectionMessage || "Please ask a study-related question!",
          timestamp: new Date(),
          isRejection: true,
        };
        setMessages((prev) => [...prev, rejectionResponse]);
        if (activeConvId) await saveMessage(activeConvId, rejectionResponse);
        return;
      }
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
      onDone: async () => {
        setIsLoading(false);
        // Save assistant message after streaming completes
        if (activeConvId && assistantContent) {
          await saveMessage(activeConvId, {
            id: assistantId,
            role: "assistant",
            content: assistantContent,
            timestamp: new Date(),
          });
        }
      },
      onError: async (error) => {
        setIsLoading(false);
        const errorMessage: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: `❌ ${error}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        if (activeConvId) await saveMessage(activeConvId, errorMessage);
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
        <div className="p-4 border-t border-border bg-card space-y-2">
          {/* Pending image preview (embedded) */}
          {pendingImage && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <img src={pendingImage} alt="Preview" className="w-12 h-12 object-cover rounded" />
              <div className="flex-1 flex gap-1">
                <button
                  onClick={() => setImageMode("solve")}
                  className={`text-xs px-2 py-1 rounded ${imageMode === "solve" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}
                >
                  Solve
                </button>
                <button
                  onClick={() => setImageMode("guide")}
                  className={`text-xs px-2 py-1 rounded ${imageMode === "guide" ? "bg-amber-500 text-white" : "bg-background text-muted-foreground"}`}
                >
                  Guide
                </button>
              </div>
              <button onClick={clearPendingImage} className="text-muted-foreground hover:text-destructive">×</button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="h-12 w-12 rounded-xl"
            >
              <ImagePlus className="w-5 h-5" />
            </Button>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pendingImage ? "Add message..." : "Ask your doubt..."}
              disabled={isLoading}
              className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <Button
              onClick={() => handleSend()}
              disabled={(!inputValue.trim() && !pendingImage) || isLoading}
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
          <div className="flex items-center gap-1">
            {userId ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={startNewChat}
                  title="New chat"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Plus className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(!showHistory)}
                  title="Chat history"
                  className={showHistory ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}
                >
                  <History className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <a
                href="/auth"
                className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
              >
                Sign in to save
              </a>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* History Panel or Messages */}
        {showHistory && userId ? (
          <div className="flex-1 overflow-y-auto bg-muted/10">
            <ChatHistory
              userId={userId}
              onSelectConversation={loadConversation}
              onClose={() => setShowHistory(false)}
            />
          </div>
        ) : (
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
        )}

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
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Pending Image Preview with Mode Selector */}
          <AnimatePresence>
            {pendingImage && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 20, height: 0 }}
                className="bg-muted/50 rounded-xl p-3 border border-border"
              >
                <div className="flex gap-3">
                  {/* Image thumbnail */}
                  <div className="relative">
                    <img
                      src={pendingImage}
                      alt="Upload preview"
                      className="w-20 h-20 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={clearPendingImage}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>

                  {/* Mode selector */}
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">How should I help?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImageMode("solve")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          imageMode === "solve"
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-background border border-border text-muted-foreground hover:border-primary"
                        }`}
                      >
                        ✏️ Solve & Explain
                      </button>
                      <button
                        onClick={() => setImageMode("guide")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          imageMode === "guide"
                            ? "bg-amber-500 text-white shadow-md"
                            : "bg-background border border-border text-muted-foreground hover:border-amber-500"
                        }`}
                      >
                        💡 Guide Me
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Suggestions Chips */}
          {messages.length > 0 && !isLoading && !pendingImage && (
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
            {/* Image upload buttons */}
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Upload image"
              >
                <ImagePlus className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCameraCapture}
                disabled={isLoading}
                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Take photo"
              >
                <Camera className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 bg-muted rounded-2xl border border-border focus-within:border-primary focus-within:bg-background transition-all flex items-center pr-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={pendingImage ? "Add a message (optional)..." : isListening ? "Listening..." : "Ask your doubt..."}
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
              disabled={(!inputValue.trim() && !pendingImage && !isListening) || isLoading}
              className={`w-12 h-12 rounded-2xl shadow-lg transition-all ${(inputValue.trim() || pendingImage) ? "scale-100" : "scale-95 opacity-80"}`}
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
