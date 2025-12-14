import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Zap, ArrowLeft, Sparkles, Loader2, Trophy } from "lucide-react";
import { Button } from "../ui/button";
import { generateQuestions, getFallbackQuestions, Question } from "@/services/questionService";
import { useToast } from "@/hooks/use-toast";
import { useStudentProfile } from "@/contexts/StudentProfileContext";

interface TapRaceGameProps {
    subject: string;
    onExit: (score: number, xpEarned: number) => void;
}

interface FallingAnswer {
    id: string;
    text: string;
    index: number;
    x: number;
    speed: number;
    y: number;
}

export const TapRaceGame = ({ subject, onExit }: TapRaceGameProps) => {
    const { toast } = useToast();
    const { profile } = useStudentProfile();
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    // Start with fallback questions immediately - NO LOADING
    const [questions, setQuestions] = useState<Question[]>(() =>
        getFallbackQuestions(subject, 3, 12)
    );
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [fallingAnswers, setFallingAnswers] = useState<FallingAnswer[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Start as false - instant play!
    const [gameOver, setGameOver] = useState(false);
    const [baseSpeed, setBaseSpeed] = useState(2);
    const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
    const [showWrongFeedback, setShowWrongFeedback] = useState(false);
    const [isAIPowered, setIsAIPowered] = useState(false);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);

    const currentQuestion = questions[currentQuestionIndex];

    // Try to load AI questions in background (optional enhancement)
    useEffect(() => {
        loadAIQuestionsInBackground();
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const loadAIQuestionsInBackground = async () => {
        try {
            const studentProfileData = profile.isConfigured ? {
                grade: profile.grade || '5',
                board: profile.board,
                preferredLanguage: profile.preferredLanguage
            } : undefined;

            const response = await generateQuestions(
                subject,
                undefined,
                3,
                { correctAnswers: 0, totalAnswers: 0, averageResponseTime: 5 },
                12,
                studentProfileData
            );

            // Only upgrade if still on first question (don't disrupt gameplay)
            if (currentQuestionIndex === 0) {
                setQuestions(response.questions);
                setIsAIPowered(true);
            }
        } catch (error) {
            // Silently fail - we already have fallback questions
            console.log("AI questions unavailable, using fallback");
        }
    };

    // Spawn falling answers when question changes
    useEffect(() => {
        if (!currentQuestion || gameOver || isLoading) return;

        const answers: FallingAnswer[] = currentQuestion.options.map((option, index) => ({
            id: `${currentQuestionIndex}-${index}`,
            text: option,
            index,
            x: 15 + (index * 20) + Math.random() * 10,
            speed: baseSpeed + Math.random() * 1,
            y: -20 - (index * 15)
        }));

        setFallingAnswers(answers);
    }, [currentQuestionIndex, currentQuestion, gameOver, isLoading, baseSpeed]);

    // Animation loop for falling answers
    useEffect(() => {
        if (gameOver || isLoading || !currentQuestion) return;

        const animate = (timestamp: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = timestamp;
            const deltaTime = (timestamp - lastTimeRef.current) / 16.67; // normalize to ~60fps
            lastTimeRef.current = timestamp;

            setFallingAnswers(prev => {
                const updated = prev.map(answer => ({
                    ...answer,
                    y: answer.y + answer.speed * deltaTime
                }));

                // Check if any answer hit the bottom
                const hitBottom = updated.find(a => a.y > 100);
                if (hitBottom) {
                    // If correct answer hit bottom, lose a life
                    if (hitBottom.index === currentQuestion.correctIndex) {
                        handleMissedCorrect();
                        return [];
                    }
                }

                return updated.filter(a => a.y <= 110);
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [gameOver, isLoading, currentQuestion, currentQuestionIndex]);

    const handleMissedCorrect = () => {
        setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
                setGameOver(true);
            }
            return newLives;
        });
        setCombo(0);
        setShowWrongFeedback(true);
        setTimeout(() => setShowWrongFeedback(false), 300);

        // Move to next question
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setGameOver(true);
            }
        }, 500);
    };

    const handleAnswerTap = useCallback((answer: FallingAnswer) => {
        if (gameOver || !currentQuestion) return;

        const isCorrect = answer.index === currentQuestion.correctIndex;

        // Remove tapped answer
        setFallingAnswers(prev => prev.filter(a => a.id !== answer.id));

        if (isCorrect) {
            // Correct answer!
            const comboBonus = combo * 15;
            const speedBonus = Math.floor((100 - answer.y) * 2);
            const points = 100 + comboBonus + speedBonus;

            setScore(prev => prev + points);
            setCombo(prev => {
                const newCombo = prev + 1;
                setMaxCombo(max => Math.max(max, newCombo));
                return newCombo;
            });
            setShowCorrectFeedback(true);
            setTimeout(() => setShowCorrectFeedback(false), 300);

            // Increase speed every 3 correct answers
            if ((combo + 1) % 3 === 0) {
                setBaseSpeed(prev => Math.min(prev + 0.3, 5));
            }

            // Next question
            setTimeout(() => {
                if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                } else {
                    setGameOver(true);
                }
            }, 300);
        } else {
            // Wrong answer
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setGameOver(true);
                }
                return newLives;
            });
            setCombo(0);
            setShowWrongFeedback(true);
            setTimeout(() => setShowWrongFeedback(false), 300);
        }
    }, [gameOver, currentQuestion, combo, currentQuestionIndex, questions.length]);

    const calculateXP = () => {
        const baseXP = score / 10;
        const comboBonus = maxCombo * 5;
        return Math.floor(baseXP + comboBonus);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-6"
                >
                    <Sparkles className="w-16 h-16 text-secondary" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground mb-2">Loading Tap Race...</h2>
                <p className="text-muted-foreground text-center">
                    Get ready to tap fast!
                </p>
                <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Preparing questions</span>
                </div>
            </div>
        );
    }

    if (gameOver) {
        const xpEarned = calculateXP();
        const accuracy = questions.length > 0
            ? ((currentQuestionIndex / questions.length) * 100).toFixed(0)
            : "0";

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
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                    >
                        🎯
                    </motion.div>

                    <h2 className="text-3xl font-extrabold gradient-text mb-2">
                        {lives > 0 ? "Race Complete!" : "Game Over!"}
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        {lives > 0 ? "Amazing reflexes!" : "Better luck next time!"}
                    </p>

                    <div className="bg-card rounded-2xl p-6 mb-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Final Score</span>
                            <span className="text-2xl font-bold text-foreground">{score}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Max Combo</span>
                            <span className="text-xl font-bold text-secondary">{maxCombo}x</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Lives Left</span>
                            <span className="text-xl font-bold text-destructive">
                                {"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border pt-4">
                            <span className="text-muted-foreground">XP Earned</span>
                            <span className="text-xl font-bold text-primary">+{xpEarned}</span>
                        </div>
                    </div>

                    <Button size="lg" className="w-full" onClick={() => onExit(score, xpEarned)}>
                        Continue
                    </Button>
                </motion.div>
            </motion.div>
        );
    }

    if (!currentQuestion) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-hidden">
            {/* Flash effects */}
            <AnimatePresence>
                {showCorrectFeedback && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-accent/20 pointer-events-none z-50"
                    />
                )}
                {showWrongFeedback && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-destructive/20 pointer-events-none z-50"
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="p-4 flex items-center justify-between relative z-10">
                <Button variant="ghost" size="icon" onClick={() => onExit(score, calculateXP())}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>

                <div className="flex items-center gap-4">
                    {/* Lives */}
                    <div className="flex items-center gap-1">
                        {[...Array(3)].map((_, i) => (
                            <Heart
                                key={i}
                                className={`w-6 h-6 ${i < lives ? 'text-destructive fill-destructive' : 'text-muted'}`}
                            />
                        ))}
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl">
                        <Zap className="w-4 h-4 text-secondary" />
                        <span className="font-bold">{score}</span>
                    </div>

                    {/* Combo */}
                    {combo > 1 && (
                        <motion.div
                            className="flex items-center gap-1 bg-gradient-secondary px-3 py-1.5 rounded-xl"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            key={combo}
                        >
                            <span className="font-bold text-secondary-foreground">{combo}x</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Question */}
            <div className="px-4 py-2">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl p-4 text-center border-2 border-secondary"
                >
                    <p className="text-xs text-muted-foreground mb-1">Tap the correct answer!</p>
                    <h2 className="text-xl font-bold text-foreground">
                        {currentQuestion.question}
                    </h2>
                </motion.div>
            </div>

            {/* Progress */}
            <div className="px-4 py-2">
                <div className="flex gap-1">
                    {questions.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${i < currentQuestionIndex
                                ? 'bg-secondary'
                                : i === currentQuestionIndex
                                    ? 'bg-secondary/50'
                                    : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Game Area - Falling Answers */}
            <div
                ref={gameAreaRef}
                className="flex-1 relative overflow-hidden"
            >
                {/* Bottom danger zone */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-destructive/20 to-transparent" />

                {/* Falling answers */}
                <AnimatePresence>
                    {fallingAnswers.map((answer) => (
                        <motion.button
                            key={answer.id}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            onClick={() => handleAnswerTap(answer)}
                            className="absolute transform -translate-x-1/2 cursor-pointer"
                            style={{
                                left: `${answer.x}%`,
                                top: `${answer.y}%`,
                            }}
                        >
                            <div className="bg-card hover:bg-primary/20 border-2 border-primary rounded-2xl px-4 py-3 min-w-[80px] text-center shadow-lg transition-colors active:scale-95">
                                <span className="font-bold text-foreground">{answer.text}</span>
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
