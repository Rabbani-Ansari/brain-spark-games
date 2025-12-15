import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";

interface AIFloatingButtonProps {
  onClick: () => void;
}

export const AIFloatingButton = ({ onClick }: AIFloatingButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-secondary text-secondary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        <MessageCircle className="w-5 h-5" />
        <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-gold" />
      </div>
      <span className="font-semibold text-sm">Ask AI Tutor</span>
    </motion.button>
  );
};
