import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface SubjectCardProps {
  title: string;
  icon: LucideIcon;
  gradient: string;
  progress: number;
  questionsAnswered: number;
  onClick: () => void;
}

export const SubjectCard = ({ 
  title, 
  icon: Icon, 
  gradient, 
  progress, 
  questionsAnswered,
  onClick 
}: SubjectCardProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="game-card w-full text-left"
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-4">
        <div 
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${gradient}`}
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {questionsAnswered} questions mastered
          </p>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className={`h-full rounded-full ${gradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{progress}% mastery</p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${gradient} opacity-10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2`} />
    </motion.button>
  );
};
