import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Trash2, Clock, ChevronRight, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  getConversations,
  deleteConversation,
} from "@/services/chatHistoryService";
import { formatDistanceToNow } from "date-fns";

interface ChatHistoryProps {
  userId: string;
  onSelectConversation: (conversationId: string) => void;
  onClose: () => void;
}

export const ChatHistory = ({
  userId,
  onSelectConversation,
  onClose,
}: ChatHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    setIsLoading(true);
    const data = await getConversations(userId);
    setConversations(data);
    setIsLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    const success = await deleteConversation(id);
    if (success) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
    }
    setDeletingId(null);
  };

  const getConversationTitle = (conv: Conversation) => {
    if (conv.title) return conv.title;
    if (conv.subject && conv.chapter) return `${conv.subject} - ${conv.chapter}`;
    if (conv.subject) return conv.subject;
    return "New Conversation";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Conversations Yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Start chatting with the AI Tutor and your conversations will appear here.
        </p>
        <Button onClick={onClose} className="mt-4">
          Start a New Chat
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Recent Conversations
      </h3>
      <AnimatePresence>
        {conversations.map((conv, index) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectConversation(conv.id)}
            className="group flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {conv.subject ? (
                <BookOpen className="w-5 h-5 text-primary" />
              ) : (
                <MessageSquare className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {getConversationTitle(conv)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                disabled={deletingId === conv.id}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                {deletingId === conv.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
