import { motion } from "framer-motion";
import { Flame, Zap, Trophy } from "lucide-react";

interface PlayerStatsProps {
  xp: number;
  level: number;
  streak: number;
}

export const PlayerStats = ({ xp, level, streak }: PlayerStatsProps) => {
  const xpForNextLevel = level * 500;
  const xpProgress = (xp % 500) / 500 * 100;

  return (
    <div className="flex items-center gap-4">
      {/* Streak */}
      <motion.div 
        className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-border"
        whileHover={{ scale: 1.05 }}
      >
        <Flame className={`w-5 h-5 ${streak > 0 ? 'text-primary streak-fire' : 'text-muted-foreground'}`} />
        <span className="font-bold text-sm">{streak}</span>
      </motion.div>

      {/* XP & Level */}
      <motion.div 
        className="flex items-center gap-3 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-border"
        whileHover={{ scale: 1.05 }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Trophy className="w-4 h-4 text-gold-foreground" />
          </div>
          <span className="font-extrabold text-lg">{level}</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="text-xs font-semibold text-muted-foreground">{xp} XP</span>
          </div>
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
