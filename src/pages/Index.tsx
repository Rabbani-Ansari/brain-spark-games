import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Atom,
  Rocket,
  Crosshair,
  Gamepad2,
  Swords,
  Trophy,
  Star,
  ChevronRight,
  BookOpen,
  Globe,
  History,
  Monitor,
  Palette,
  User,
  Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerStats } from "@/components/PlayerStats";
import { SubjectCard } from "@/components/SubjectCard";
import { GameModeCard } from "@/components/GameModeCard";
import { RocketGame } from "@/components/RocketGame";
import { TapRaceGame } from "@/components/games/TapRaceGame";
import { BubblePopGame } from "@/components/games/BubblePopGame";
import { MemoryMatchGame } from "@/components/games/MemoryMatchGame";
import { NumberNinjaGame } from "@/components/games/NumberNinjaGame";
import { useStudentProfile } from "@/contexts/StudentProfileContext";
import { AIFloatingButton } from "@/components/ai-chat/AIFloatingButton";
import { ChatInterface } from "@/components/ai-chat/ChatInterface";
import { StudentContext } from "@/services/doubtSolverService";
import { SubjectHub } from "@/components/dashboard/SubjectHub";
import { ALLOWED_TOPICS } from "@/services/subjectValidator";

type Screen = 'home' | 'subject' | 'hub' | 'modes' | 'game';

interface PlayerData {
  xp: number;
  level: number;
  streak: number;
  mathProgress: number;
  scienceProgress: number;
  englishProgress: number;
  [key: string]: number; // Allow dynamic progress keys
}

const SUBJECT_CONFIG: Record<string, { icon: any, gradient: string }> = {
  'Mathematics': { icon: Calculator, gradient: "bg-gradient-primary" },
  'Science': { icon: Atom, gradient: "bg-gradient-secondary" },
  'English': { icon: BookOpen, gradient: "bg-gradient-to-br from-pink-500 to-rose-500" },
  'Marathi': { icon: Languages, gradient: "bg-gradient-to-br from-orange-400 to-red-500" },
  'Hindi': { icon: Languages, gradient: "bg-gradient-to-br from-amber-400 to-orange-500" },
  'History and Civics': { icon: History, gradient: "bg-gradient-to-br from-blue-400 to-indigo-500" },
  'Geography': { icon: Globe, gradient: "bg-gradient-to-br from-emerald-400 to-teal-500" },
  'Environmental Studies - Part I': { icon: Atom, gradient: "bg-gradient-to-br from-green-400 to-emerald-600" },
  'Environmental Studies - Part II': { icon: History, gradient: "bg-gradient-to-br from-yellow-400 to-orange-500" },
  'Art Education': { icon: Palette, gradient: "bg-gradient-to-br from-purple-400 to-fuchsia-500" },
  'Physical Education': { icon: User, gradient: "bg-gradient-to-br from-red-400 to-red-600" },
  'Computer Science': { icon: Monitor, gradient: "bg-gradient-to-br from-slate-700 to-slate-900" },
  'Sanskrit': { icon: Languages, gradient: "bg-gradient-to-br from-indigo-400 to-purple-600" },
  'Work Experience': { icon: User, gradient: "bg-gradient-to-br from-gray-400 to-gray-600" }
};

const Index = () => {
  const navigate = useNavigate();
  const { profile } = useStudentProfile();
  const [screen, setScreen] = useState<Screen>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Redirect to onboarding if not configured
  useEffect(() => {
    if (!profile.isConfigured) {
      navigate('/onboarding');
    }
  }, [profile.isConfigured, navigate]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData>({
    xp: 350,
    level: 3,
    streak: 5,
    mathProgress: 45,
    scienceProgress: 28,
    englishProgress: 12
  });

  // Build student context for AI
  const studentContext: StudentContext = {
    grade: profile.grade || '5',
    board: profile.board === 'maharashtra_state_board' ? 'Maharashtra State Board' : profile.board,
    language: profile.preferredLanguage === 'en' ? 'English' : profile.preferredLanguage === 'hi' ? 'Hindi' : 'Marathi',
    subject: selectedSubject || undefined,
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setScreen('hub');
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
        : prev.scienceProgress,
      englishProgress: selectedSubject === 'English'
        ? Math.min(100, prev.englishProgress + Math.floor(xpEarned / 20))
        : prev.englishProgress
    }));
    setScreen('hub');
    setSelectedMode(null);
  };

  // Get subjects based on profile
  const boardName = profile.board === 'maharashtra_state_board' ? 'Maharashtra State Board' : profile.board;
  const gradeNum = parseInt(profile.grade || '5');
  const availableSubjects = ALLOWED_TOPICS[boardName]?.[gradeNum] || ['Mathematics', 'Science', 'English'];

  // Render the selected game
  if (screen === 'game' && selectedSubject && selectedMode) {
    switch (selectedMode) {
      case 'rocket':
        return <RocketGame subject={selectedSubject} onExit={handleGameExit} />;
      case 'taprace':
        return <TapRaceGame subject={selectedSubject} onExit={handleGameExit} />;
      case 'bubblepop':
        return <BubblePopGame subject={selectedSubject} onExit={handleGameExit} />;
      case 'memory':
        return <MemoryMatchGame subject={selectedSubject} onExit={handleGameExit} />;
      case 'ninja':
        return <NumberNinjaGame subject={selectedSubject} onExit={handleGameExit} />;
      default:
        return <RocketGame subject={selectedSubject} onExit={handleGameExit} />;
    }
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
                  <span className="gradient-text">Brain</span>
                  <span className="text-foreground">Spark</span>
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
                  {availableSubjects.map((subject) => {
                    const config = SUBJECT_CONFIG[subject] || {
                      icon: BookOpen,
                      gradient: "bg-gradient-to-br from-slate-400 to-slate-600"
                    };

                    // Generate a safe progress key or default to 0
                    // Note: In a real app we'd map this more robustly
                    const progressKey = subject.toLowerCase().includes('math') ? 'mathProgress' :
                      subject.toLowerCase().includes('science') ? 'scienceProgress' :
                        subject.toLowerCase().includes('english') ? 'englishProgress' : 'xp'; // Fallback

                    return (
                      <SubjectCard
                        key={subject}
                        title={subject}
                        icon={config.icon}
                        gradient={config.gradient}
                        progress={playerData[progressKey] || 0} // Simplify progress for now
                        questionsAnswered={Math.floor(Math.random() * 50) + 10} // Mock data
                        onClick={() => handleSubjectSelect(subject)}
                      />
                    );
                  })}
                </div>
              </motion.div>
            </section>

            {/* Quick Stats */}
            <section className="px-5 pb-24">
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



        {screen === 'hub' && selectedSubject && (
          <SubjectHub
            subject={selectedSubject}
            onBack={() => {
              setScreen('home');
              setSelectedSubject(null);
            }}
            onGameSelect={handleModeSelect}
            context={studentContext}
          />
        )}
      </AnimatePresence>

      {/* AI Floating Button - visible on home only */}
      {screen === 'home' && (
        <AIFloatingButton onClick={() => setIsChatOpen(true)} />
      )}

      {/* AI Chat Interface */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={studentContext}
        variant="fullscreen"
      />
    </div>
  );
};

export default Index;
