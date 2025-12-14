import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, X, Check, Zap, Clock, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: number;
}

const generateQuestion = (difficulty: number): Question => {
  const operations = ['+', '-', '×'];
  const operation = operations[Math.floor(Math.random() * (difficulty > 3 ? 3 : 2))];
  
  let a: number, b: number, answer: number;
  
  const maxNum = Math.min(10 + difficulty * 5, 50);
  
  switch (operation) {
    case '+':
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * maxNum) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * maxNum) + 10;
      b = Math.floor(Math.random() * Math.min(a, maxNum)) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }
  
  // Generate wrong answers
  const wrongAnswers = new Set<number>();
  while (wrongAnswers.size < 3) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrong = answer + (offset === 0 ? 1 : offset);
    if (wrong !== answer && wrong > 0) {
      wrongAnswers.add(wrong);
    }
  }
  
  const options = [answer, ...Array.from(wrongAnswers)].sort(() => Math.random() - 0.5);
  
  return {
    id: Date.now(),
    question: `${a} ${operation} ${b} = ?`,
    options: options.map(String),
    correctIndex: options.indexOf(answer),
    difficulty
  };
};

interface RocketGameProps {
  subject: string;
  onExit: (score: number, xpEarned: number) => void;
}

export const RocketGame = ({ subject, onExit }: RocketGameProps) => {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [rocketPosition, setRocketPosition] = useState(20);
  const [question, setQuestion] = useState<Question>(() => generateQuestion(1));
  const [timeLeft, setTimeLeft] = useState(10);
  const [isAnswered, setIsAnswered] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [rocketBoost, setRocketBoost] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (gameOver || isAnswered !== null) return;
    
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
  }, [question.id, gameOver, isAnswered]);

  const handleTimeout = () => {
    setIsCorrect(false);
    setCombo(0);
    setRocketPosition(prev => Math.max(5, prev - 10));
    
    setTimeout(() => {
      if (questionsAnswered >= 9) {
        endGame();
      } else {
        nextQuestion();
      }
    }, 1000);
  };

  const handleAnswer = useCallback((index: number) => {
    if (isAnswered !== null || gameOver) return;
    
    setIsAnswered(index);
    const correct = index === question.correctIndex;
    setIsCorrect(correct);
    
    if (correct) {
      const timeBonus = Math.floor(timeLeft * 5);
      const comboBonus = combo * 10;
      const points = 50 + timeBonus + comboBonus;
      
      setScore(prev => prev + points);
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(max => Math.max(max, newCombo));
        return newCombo;
      });
      setRocketPosition(prev => Math.min(95, prev + 8));
      setRocketBoost(true);
      setTimeout(() => setRocketBoost(false), 300);
      
      // Increase difficulty every 3 correct answers
      if ((questionsAnswered + 1) % 3 === 0) {
        setDifficulty(prev => Math.min(prev + 1, 10));
      }
    } else {
      setCombo(0);
      setRocketPosition(prev => Math.max(5, prev - 15));
    }
    
    setTimeout(() => {
      if (questionsAnswered >= 9) {
        endGame();
      } else {
        nextQuestion();
      }
    }, 1200);
  }, [isAnswered, gameOver, question.correctIndex, timeLeft, combo, questionsAnswered]);

  const nextQuestion = () => {
    setQuestion(generateQuestion(difficulty));
    setTimeLeft(Math.max(5, 10 - Math.floor(difficulty / 3)));
    setIsAnswered(null);
    setIsCorrect(null);
    setQuestionsAnswered(prev => prev + 1);
  };

  const endGame = () => {
    setGameOver(true);
  };

  const calculateXP = () => {
    const baseXP = score / 10;
    const comboBonus = maxCombo * 5;
    return Math.floor(baseXP + comboBonus);
  };

  if (gameOver) {
    const xpEarned = calculateXP();
    
    return (
      <motion.div 
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center"
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
          
          <div className="bg-card rounded-2xl p-6 mb-8 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Final Score</span>
              <span className="text-2xl font-bold text-foreground">{score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Max Combo</span>
              <span className="text-xl font-bold text-primary">{maxCombo}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">XP Earned</span>
              <span className="text-xl font-bold text-secondary">+{xpEarned}</span>
            </div>
          </div>
          
          <Button size="xl" onClick={() => onExit(score, xpEarned)}>
            Continue
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => onExit(score, calculateXP())}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <div className="flex items-center gap-4">
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
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < questionsAnswered 
                  ? 'bg-gradient-primary' 
                  : i === questionsAnswered 
                    ? 'bg-primary/50' 
                    : 'bg-muted'
              }`}
            />
          ))}
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
                animate={{ width: `${(timeLeft / 10) * 100}%` }}
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
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-6"
            >
              <h2 className="text-3xl font-extrabold text-foreground text-center mb-8">
                {question.question}
              </h2>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                {question.options.map((option, index) => {
                  const isSelected = isAnswered === index;
                  const showCorrect = isAnswered !== null && index === question.correctIndex;
                  const showWrong = isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={isAnswered !== null}
                      className={`
                        relative p-5 rounded-2xl font-bold text-xl transition-all
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
                      {option}
                      
                      {showCorrect && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-accent flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-accent-foreground" />
                        </motion.div>
                      )}
                      
                      {showWrong && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-destructive flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-destructive-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
