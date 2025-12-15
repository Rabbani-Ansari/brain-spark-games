import { motion } from "framer-motion";
import { HelpCircle, Sparkles } from "lucide-react";

interface AIHelpButtonProps {
  onClick: () => void;
}

export const AIHelpButton = ({ onClick }: AIHelpButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-1.5 bg-secondary/20 hover:bg-secondary/30 text-secondary px-3 py-1.5 rounded-lg transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <HelpCircle className="w-4 h-4" />
      <Sparkles className="w-3 h-3" />
      <span className="text-xs font-semibold">Ask AI</span>
    </motion.button>
  );
};
