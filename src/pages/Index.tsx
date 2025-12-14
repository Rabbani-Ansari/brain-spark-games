import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  Atom, 
  Rocket, 
  Crosshair, 
  GripVertical, 
  Skull,
  Trophy,
  Star,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerStats } from "@/components/PlayerStats";
import { SubjectCard } from "@/components/SubjectCard";
import { GameModeCard } from "@/components/GameModeCard";
import { RocketGame } from "@/components/RocketGame";

type Screen = 'home' | 'subject' | 'modes' | 'game';

interface PlayerData {
  xp: number;
  level: number;
  streak: number;
  mathProgress: number;
  scienceProgress: number;
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData>({
    xp: 350,
    level: 3,
    streak: 5,
    mathProgress: 45,
    scienceProgress: 28
  });

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setScreen('modes');
  };

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
    setScreen('game');
  };

  const handleGameExit = (score: number, xpEarned: number) => {
    setPlayerData(prev => ({
      ...prev,
      xp: prev.xp + xpEarned,
      level: Math.floor((prev.xp + xpEarned) / 500) + 1,
      streak: prev.streak + 1,
      mathProgress: selectedSubject === 'Mathematics' 
        ? Math.min(100, prev.mathProgress + Math.floor(xpEarned / 20))
        : prev.mathProgress,
      scienceProgress: selectedSubject === 'Science'
        ? Math.min(100, prev.scienceProgress + Math.floor(xpEarned / 20))
        : prev.scienceProgress
    }));
    setScreen('home');
    setSelectedMode(null);
    setSelectedSubject(null);
  };

  if (screen === 'game' && selectedSubject) {
    return <RocketGame subject={selectedSubject} onExit={handleGameExit} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <AnimatePresence mode="wait">
        {screen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="relative min-h-screen flex flex-col"
          >
            {/* Header */}
            <header className="p-5 flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-2xl font-extrabold">
                  <span className="gradient-text">Quiz</span>
                  <span className="text-foreground">Quest</span>
                </h1>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <PlayerStats 
                  xp={playerData.xp} 
                  level={playerData.level} 
                  streak={playerData.streak} 
                />
              </motion.div>
            </header>

            {/* Hero Section */}
            <section className="px-5 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-surface rounded-3xl p-6 border border-border overflow-hidden relative"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-gold" />
                    <span className="text-sm font-semibold text-gold">Daily Challenge</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Ready to boost your brain? 🧠
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Complete today's challenge to earn bonus XP
                  </p>
                  <Button variant="gold" className="group">
                    Start Challenge
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
                
                {/* Decorative rocket */}
                <motion.div 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl floating"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  🚀
                </motion.div>
              </motion.div>
            </section>

            {/* Subjects Section */}
            <section className="px-5 pb-8 flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xl font-bold text-foreground mb-4">Choose Subject</h3>
                
                <div className="space-y-4">
                  <SubjectCard
                    title="Mathematics"
                    icon={Calculator}
                    gradient="bg-gradient-primary"
                    progress={playerData.mathProgress}
                    questionsAnswered={142}
                    onClick={() => handleSubjectSelect('Mathematics')}
                  />
                  
                  <SubjectCard
                    title="Science"
                    icon={Atom}
                    gradient="bg-gradient-secondary"
                    progress={playerData.scienceProgress}
                    questionsAnswered={89}
                    onClick={() => handleSubjectSelect('Science')}
                  />
                </div>
              </motion.div>
            </section>

            {/* Quick Stats */}
            <section className="px-5 pb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-3"
              >
                <div className="bg-card rounded-2xl p-4 text-center">
                  <Trophy className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">231</p>
                  <p className="text-xs text-muted-foreground">Total Score</p>
                </div>
                <div className="bg-card rounded-2xl p-4 text-center">
                  <Rocket className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">24</p>
                  <p className="text-xs text-muted-foreground">Games Played</p>
                </div>
                <div className="bg-card rounded-2xl p-4 text-center">
                  <Star className="w-6 h-6 text-secondary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">85%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </motion.div>
            </section>
          </motion.div>
        )}

        {screen === 'modes' && selectedSubject && (
          <motion.div
            key="modes"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-screen flex flex-col p-5"
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setScreen('home')}
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{selectedSubject}</h1>
                <p className="text-muted-foreground">Choose your game mode</p>
              </div>
            </div>

            {/* Game Modes */}
            <div className="space-y-4">
              <GameModeCard
                title="Rocket Mode"
                description="Race against time! Correct answers boost your rocket"
                icon={Rocket}
                gradient="bg-gradient-primary"
                onClick={() => handleModeSelect('rocket')}
              />
              
              <GameModeCard
                title="Tap Race"
                description="Quick reflexes! Tap the right answer fast"
                icon={Crosshair}
                gradient="bg-gradient-secondary"
                onClick={() => handleModeSelect('taprace')}
              />
              
              <GameModeCard
                title="Drag & Drop"
                description="Match concepts by dragging to correct spots"
                icon={GripVertical}
                gradient="bg-gradient-accent"
                locked
                onClick={() => {}}
              />
              
              <GameModeCard
                title="Survival Mode"
                description="One mistake and you're out! How long can you last?"
                icon={Skull}
                gradient="bg-gradient-to-br from-special to-destructive"
                locked
                onClick={() => {}}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
