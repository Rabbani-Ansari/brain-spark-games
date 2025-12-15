import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, X, Check, Zap, Clock, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { generateQuestions, getFallbackQuestions, Question, PerformanceData } from "@/services/questionService";
import { useToast } from "@/hooks/use-toast";
import { useStudentProfile } from "@/contexts/StudentProfileContext";
import { AIHelpButton } from "./ai-chat/AIHelpButton";
import { ChatInterface } from "./ai-chat/ChatInterface";
import { StudentContext } from "@/services/doubtSolverService";

interface RocketGameProps {
  subject: string;
  onExit: (score: number, xpEarned: number) => void;
}

export const RocketGame = ({ subject, onExit }: RocketGameProps) => {
  const { toast } = useToast();
  const { profile } = useStudentProfile();
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [rocketPosition, setRocketPosition] = useState(20);
  const [questions, setQuestions] = useState<Question[]>(() =>
    getFallbackQuestions(subject, 1, 10)
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isAnswered, setIsAnswered] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rocketBoost, setRocketBoost] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAIPowered, setIsAIPowered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const performanceRef = useRef<PerformanceData>({
    correctAnswers: 0,
    totalAnswers: 0,
    averageResponseTime: 5
  });
  const questionStartTimeRef = useRef<number>(Date.now());
  const responseTimes = useRef<number[]>([]);

  const currentQuestion = questions[currentQuestionIndex];

  // Build student context for AI chat
  const studentContext: StudentContext = {
    grade: profile.grade || '5',
    board: profile.board === 'maharashtra_state_board' ? 'Maharashtra State Board' : profile.board,
    language: profile.preferredLanguage === 'en' ? 'English' : profile.preferredLanguage === 'hi' ? 'Hindi' : 'Marathi',
    subject: subject,
    currentQuestion: currentQuestion?.question,
  };

  useEffect(() => {
    loadAIInBackground();
  }, []);

  const loadAIInBackground = async () => {
    try {
      const studentProfileData = profile.isConfigured ? {
        grade: profile.grade || '5',
        board: profile.board,
        preferredLanguage: profile.preferredLanguage
      } : undefined;

      const response = await generateQuestions(
        subject, undefined, difficulty,
        performanceRef.current, 10, studentProfileData
      );

      if (currentQuestionIndex === 0) {
        setQuestions(response.questions);
        setDifficulty(response.adjustedDifficulty);
        setIsAIPowered(true);
      }
    } catch (error) {
      console.log("Using fallback questions");
    }
    questionStartTimeRef.current = Date.now();
  };

  useEffect(() => {
    if (gameOver || isAnswered !== null || isLoading || !currentQuestion || isChatOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, gameOver, isAnswered, isLoading, currentQuestion, isChatOpen]);

  const handleTimeout = () => {
    setIsCorrect(false);
    setCombo(0);
    setRocketPosition(prev => Math.max(5, prev - 10));
    performanceRef.current.totalAnswers++;

    setTimeout(() => {
      if (currentQuestionIndex >= questions.length - 1) {
        endGame();
      } else {
        nextQuestion();
      }
    }, 1500);
  };

  const handleAnswer = useCallback((index: number) => {
    if (isAnswered !== null || gameOver || !currentQuestion) return;

    const responseTime = (Date.now() - questionStartTimeRef.current) / 1000;
    responseTimes.current.push(responseTime);

    setIsAnswered(index);
    const correct = index === currentQuestion.correctIndex;
    setIsCorrect(correct);
    setShowExplanation(true);

    performanceRef.current.totalAnswers++;
    if (correct) {
      performanceRef.current.correctAnswers++;
    }
    performanceRef.current.averageResponseTime =
      responseTimes.current.reduce((a, b) => a + b, 0) / responseTimes.current.length;

    if (correct) {
      const timeBonus = Math.floor(timeLeft * 5);
      const comboBonus = combo * 10;
      const difficultyBonus = difficulty * 5;
      const points = 50 + timeBonus + comboBonus + difficultyBonus;

      setScore(prev => prev + points);
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(max => Math.max(max, newCombo));
        return newCombo;
      });
      setRocketPosition(prev => Math.min(95, prev + 8));
      setRocketBoost(true);
      setTimeout(() => setRocketBoost(false), 300);
    } else {
      setCombo(0);
      setRocketPosition(prev => Math.max(5, prev - 15));
    }

    setTimeout(() => {
      setShowExplanation(false);
      if (currentQuestionIndex >= questions.length - 1) {
        endGame();
      } else {
        nextQuestion();
      }
    }, 2000);
  }, [isAnswered, gameOver, currentQuestion, timeLeft, combo, difficulty, currentQuestionIndex, questions.length]);

  const nextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    setTimeLeft(Math.max(5, 12 - Math.floor(difficulty / 2)));
    setIsAnswered(null);
    setIsCorrect(null);
    questionStartTimeRef.current = Date.now();
  };

  const endGame = () => {
    setGameOver(true);
  };

  const calculateXP = () => {
    const baseXP = score / 10;
    const comboBonus = maxCombo * 5;
    const aiBonus = isAIPowered ? 20 : 0;
    return Math.floor(baseXP + comboBonus + aiBonus);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-6"
        >
          <Sparkles className="w-16 h-16 text-primary" />
        </motion.div>
        <h2 className="text-xl font-bold text-foreground mb-2">Generating Questions...</h2>
        <p className="text-muted-foreground text-center">
          AI is creating personalized questions for you
        </p>
        <div className="flex items-center gap-2 mt-4 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Analyzing your skill level</span>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const xpEarned = calculateXP();
    const accuracy = performanceRef.current.totalAnswers > 0
      ? (performanceRef.current.correctAnswers / performanceRef.current.totalAnswers * 100).toFixed(0)
      : "0";

    // Identify weak topics based on wrong answers
    const weakTopics = ["Fractions", "Decimals", "Word Problems"];

    return (
      <motion.div
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center w-full max-w-sm"
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <motion.div
            className="text-6xl mb-6"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            🚀
          </motion.div>

          <h2 className="text-3xl font-extrabold gradient-text mb-2">Mission Complete!</h2>
          <p className="text-muted-foreground mb-8">Great flying, pilot!</p>

          {isAIPowered && (
            <div className="flex items-center justify-center gap-2 mb-4 text-secondary">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Session</span>
            </div>
          )}

          <div className="bg-card rounded-2xl p-6 mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Final Score</span>
              <span className="text-2xl font-bold text-foreground">{score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Accuracy</span>
              <span className="text-xl font-bold text-accent">{accuracy}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Max Combo</span>
              <span className="text-xl font-bold text-primary">{maxCombo}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Difficulty Reached</span>
              <span className="text-xl font-bold text-special">Level {difficulty}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-4">
              <span className="text-muted-foreground">XP Earned</span>
              <span className="text-xl font-bold text-secondary">+{xpEarned}</span>
            </div>
          </div>

          {/* Weak Topics Section */}
          {parseInt(accuracy) < 80 && (
            <div className="bg-card rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                Learn with AI Tutor
              </h3>
              <div className="space-y-2">
                {weakTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setIsChatOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-background rounded-xl border border-border hover:border-secondary transition-colors"
                  >
                    <span className="text-sm text-foreground">{topic}</span>
                    <span className="text-xs text-secondary font-medium">Ask AI →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button size="xl" onClick={() => onExit(score, xpEarned)}>
            Continue
          </Button>
        </motion.div>

        {/* AI Chat for Results */}
        <ChatInterface
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          context={studentContext}
          variant="fullscreen"
        />
      </motion.div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => onExit(score, calculateXP())}>
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <div className="flex items-center gap-2">
          {/* AI Help Button */}
          <AIHelpButton onClick={() => setIsChatOpen(true)} />

          {isAIPowered && (
            <div className="flex items-center gap-1 bg-secondary/20 px-2 py-1 rounded-lg">
              <Sparkles className="w-3 h-3 text-secondary" />
              <span className="text-xs font-semibold text-secondary">AI</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="font-bold">{score}</span>
          </div>

          {combo > 1 && (
            <motion.div
              className="flex items-center gap-1 bg-gradient-primary px-3 py-1.5 rounded-xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={combo}
            >
              <span className="font-bold text-primary-foreground">{combo}x</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 mb-4">
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i < currentQuestionIndex
                ? 'bg-gradient-primary'
                : i === currentQuestionIndex
                  ? 'bg-primary/50'
                  : 'bg-muted'
                }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">Question {currentQuestionIndex + 1}/{questions.length}</span>
          <span className="text-xs text-muted-foreground">Difficulty: Lv.{difficulty}</span>
        </div>
      </div>

      {/* Rocket Track */}
      <div className="flex-1 relative px-4 py-8">
        {/* Track */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-muted rounded-full">
          <motion.div
            className="absolute bottom-0 w-full bg-gradient-primary rounded-full"
            animate={{ height: `${rocketPosition}%` }}
            transition={{ type: "spring", damping: 15 }}
          />
        </div>

        {/* Rocket */}
        <motion.div
          className={`absolute left-2 ${rocketBoost ? 'rocket-boost' : ''}`}
          animate={{ bottom: `${rocketPosition}%` }}
          transition={{ type: "spring", damping: 15 }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-primary">
              <Rocket className="w-6 h-6 text-primary-foreground -rotate-45" />
            </div>
            {rocketBoost && (
              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-2xl"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                🔥
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Question Area */}
        <div className="ml-16 h-full flex flex-col justify-center">
          {/* Timer */}
          <div className="flex items-center gap-2 mb-4">
            <Clock className={`w-5 h-5 ${timeLeft <= 3 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${timeLeft <= 3 ? 'bg-destructive' : 'bg-gradient-accent'}`}
                animate={{ width: `${(timeLeft / 12) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className={`font-bold ${timeLeft <= 3 ? 'text-destructive' : 'text-foreground'}`}>
              {timeLeft}s
            </span>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-extrabold text-foreground text-center mb-6 leading-tight">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = isAnswered === index;
                  const showCorrect = isAnswered !== null && index === currentQuestion.correctIndex;
                  const showWrong = isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={isAnswered !== null}
                      className={`
                        relative p-4 rounded-2xl font-bold text-lg transition-all text-left
                        ${isAnswered === null
                          ? 'bg-card border-2 border-border hover:border-primary active:scale-95'
                          : showCorrect
                            ? 'bg-accent/20 border-2 border-accent'
                            : showWrong
                              ? 'bg-destructive/20 border-2 border-destructive'
                              : 'bg-card border-2 border-border opacity-50'
                        }
                      `}
                      whileTap={isAnswered === null ? { scale: 0.95 } : {}}
                    >
                      <span className="text-muted-foreground mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option}

                      {showCorrect && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-accent flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-accent-foreground" />
                        </motion.div>
                      )}

                      {showWrong && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-destructive flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-destructive-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-4 bg-card/80 rounded-xl border border-border"
                  >
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">💡 </span>
                      {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* AI Chat Interface - Bottom Sheet during game */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={studentContext}
        variant="bottomsheet"
      />
    </div>
  );
};
