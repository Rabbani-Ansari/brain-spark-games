import { motion } from "framer-motion";
import { LucideIcon, Lock } from "lucide-react";

interface GameModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  locked?: boolean;
  onClick: () => void;
}

export const GameModeCard = ({ 
  title, 
  description, 
  icon: Icon, 
  gradient, 
  locked = false,
  onClick 
}: GameModeCardProps) => {
  return (
    <motion.button
      onClick={locked ? undefined : onClick}
      className={`game-card w-full text-left ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
      whileHover={locked ? {} : { scale: 1.02, y: -4 }}
      whileTap={locked ? {} : { scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-4">
        <div 
          className={`relative w-16 h-16 rounded-2xl flex items-center justify-center ${gradient}`}
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        >
          <Icon className="w-8 h-8 text-white" />
          {locked && (
            <div className="absolute inset-0 bg-background/60 rounded-2xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground">{title}</h3>
            {locked && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                Level 5
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>

      {/* Glow effect on hover */}
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl`} />
    </motion.button>
  );
};
