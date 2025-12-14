import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Zap, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { generateQuestions, getFallbackQuestions, Question } from "@/services/questionService";
import { useToast } from "@/hooks/use-toast";
import { useStudentProfile } from "@/contexts/StudentProfileContext";

interface BubblePopGameProps {
    subject: string;
    onExit: (score: number, xpEarned: number) => void;
}

interface Bubble {
    id: string;
    text: string;
    index: number;
    x: number;
    y: number;
    size: number;
    color: string;
    vx: number;
    vy: number;
    popped: boolean;
}

const BUBBLE_COLORS = [
    'from-primary to-primary/70',
    'from-secondary to-secondary/70',
    'from-accent to-accent/70',
    'from-pink-500 to-pink-400',
    'from-cyan-500 to-cyan-400',
];

export const BubblePopGame = ({ subject, onExit }: BubblePopGameProps) => {
    const { toast } = useToast();
    const { profile } = useStudentProfile();
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    // Start instantly with fallback questions
    const [questions, setQuestions] = useState<Question[]>(() =>
        getFallbackQuestions(subject, 3, 10)
    );
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [isLoading, setIsLoading] = useState(false); // No loading!
    const [gameOver, setGameOver] = useState(false);
    const [popEffects, setPopEffects] = useState<{ x: number, y: number, correct: boolean }[]>([]);
    const animationRef = useRef<number>();
    const containerRef = useRef<HTMLDivElement>(null);

    const currentQuestion = questions[currentQuestionIndex];

    // Try AI in background
    useEffect(() => {
        loadAIInBackground();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const loadAIInBackground = async () => {
        try {
            const studentProfileData = profile.isConfigured ? {
                grade: profile.grade || '5',
                board: profile.board,
                preferredLanguage: profile.preferredLanguage
            } : undefined;

            const response = await generateQuestions(
                subject, undefined, 3,
                { correctAnswers: 0, totalAnswers: 0, averageResponseTime: 5 },
                10, studentProfileData
            );
            if (currentQuestionIndex === 0) {
                setQuestions(response.questions);
            }
        } catch (error) {
            console.log("Using fallback questions");
        }
    };

    // Spawn bubbles when question changes
    useEffect(() => {
        if (!currentQuestion || gameOver || isLoading) return;

        const newBubbles: Bubble[] = currentQuestion.options.map((option, index) => ({
            id: `${currentQuestionIndex}-${index}`,
            text: option,
            index,
            x: 20 + Math.random() * 60,
            y: 30 + Math.random() * 40,
            size: 70 + Math.random() * 20,
            color: BUBBLE_COLORS[index % BUBBLE_COLORS.length],
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            popped: false
        }));

        setBubbles(newBubbles);
    }, [currentQuestionIndex, currentQuestion, gameOver, isLoading]);

    // Animate bubbles floating
    useEffect(() => {
        if (gameOver || isLoading) return;

        const animate = () => {
            setBubbles(prev => prev.map(bubble => {
                if (bubble.popped) return bubble;

                let newX = bubble.x + bubble.vx;
                let newY = bubble.y + bubble.vy;
                let newVx = bubble.vx;
                let newVy = bubble.vy;

                // Bounce off walls
                if (newX < 10 || newX > 90) newVx = -newVx;
                if (newY < 20 || newY > 80) newVy = -newVy;

                // Add slight random movement
                newVx += (Math.random() - 0.5) * 0.02;
                newVy += (Math.random() - 0.5) * 0.02;

                // Limit velocity
                newVx = Math.max(-0.5, Math.min(0.5, newVx));
                newVy = Math.max(-0.5, Math.min(0.5, newVy));

                return {
                    ...bubble,
                    x: Math.max(10, Math.min(90, newX)),
                    y: Math.max(20, Math.min(80, newY)),
                    vx: newVx,
                    vy: newVy
                };
            }));

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [gameOver, isLoading]);

    const handleBubblePop = useCallback((bubble: Bubble) => {
        if (gameOver || bubble.popped || !currentQuestion) return;

        const isCorrect = bubble.index === currentQuestion.correctIndex;

        // Add pop effect
        setPopEffects(prev => [...prev, { x: bubble.x, y: bubble.y, correct: isCorrect }]);
        setTimeout(() => {
            setPopEffects(prev => prev.slice(1));
        }, 500);

        // Mark as popped
        setBubbles(prev => prev.map(b =>
            b.id === bubble.id ? { ...b, popped: true } : b
        ));

        if (isCorrect) {
            const comboBonus = combo * 20;
            const points = 150 + comboBonus;

            setScore(prev => prev + points);
            setCombo(prev => {
                const newCombo = prev + 1;
                setMaxCombo(max => Math.max(max, newCombo));
                return newCombo;
            });

            // Pop all remaining bubbles
            setTimeout(() => {
                setBubbles(prev => prev.map(b => ({ ...b, popped: true })));
            }, 200);

            // Next question
            setTimeout(() => {
                if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                } else {
                    setGameOver(true);
                }
            }, 600);
        } else {
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) setGameOver(true);
                return newLives;
            });
            setCombo(0);
        }
    }, [gameOver, currentQuestion, combo, currentQuestionIndex, questions.length]);

    const calculateXP = () => {
        const baseXP = score / 10;
        const comboBonus = maxCombo * 5;
        return Math.floor(baseXP + comboBonus);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-cyan-900/20 to-background flex flex-col items-center justify-center p-6">
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mb-6"
                >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                        <span className="text-3xl">🫧</span>
                    </div>
                </motion.div>
                <h2 className="text-xl font-bold text-foreground mb-2">Loading Bubble Pop...</h2>
                <p className="text-muted-foreground text-center">Get ready to pop!</p>
            </div>
        );
    }

    if (gameOver) {
        const xpEarned = calculateXP();

        return (
            <motion.div
                className="min-h-screen bg-gradient-to-b from-cyan-900/20 to-background flex flex-col items-center justify-center p-6"
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
                        🫧
                    </motion.div>

                    <h2 className="text-3xl font-extrabold gradient-text mb-2">
                        {lives > 0 ? "Bubbles Cleared!" : "Game Over!"}
                    </h2>

                    <div className="bg-card rounded-2xl p-6 mb-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Final Score</span>
                            <span className="text-2xl font-bold text-foreground">{score}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Max Combo</span>
                            <span className="text-xl font-bold text-secondary">{maxCombo}x</span>
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
        <div className="min-h-screen bg-gradient-to-b from-cyan-900/20 to-background flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between relative z-10">
                <Button variant="ghost" size="icon" onClick={() => onExit(score, calculateXP())}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        {[...Array(3)].map((_, i) => (
                            <Heart
                                key={i}
                                className={`w-6 h-6 ${i < lives ? 'text-destructive fill-destructive' : 'text-muted'}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl">
                        <Zap className="w-4 h-4 text-secondary" />
                        <span className="font-bold">{score}</span>
                    </div>

                    {combo > 1 && (
                        <motion.div
                            className="flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 rounded-xl"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            key={combo}
                        >
                            <span className="font-bold text-white">{combo}x</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Question */}
            <div className="px-4 py-2">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card/80 backdrop-blur rounded-2xl p-4 text-center border-2 border-cyan-500/50"
                >
                    <p className="text-xs text-cyan-400 mb-1">Pop the correct bubble! 🫧</p>
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
                            className={`h-1 flex-1 rounded-full ${i < currentQuestionIndex ? 'bg-cyan-500' : i === currentQuestionIndex ? 'bg-cyan-500/50' : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Game Area - Floating Bubbles */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden">
                {/* Pop effects */}
                <AnimatePresence>
                    {popEffects.map((effect, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 2, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute pointer-events-none"
                            style={{ left: `${effect.x}%`, top: `${effect.y}%` }}
                        >
                            <div className={`w-16 h-16 rounded-full ${effect.correct ? 'bg-accent/50' : 'bg-destructive/50'}`} />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Bubbles */}
                <AnimatePresence>
                    {bubbles.filter(b => !b.popped).map((bubble) => (
                        <motion.button
                            key={bubble.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ type: "spring", damping: 15 }}
                            onClick={() => handleBubblePop(bubble)}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                            style={{
                                left: `${bubble.x}%`,
                                top: `${bubble.y}%`,
                            }}
                        >
                            <div
                                className={`rounded-full bg-gradient-to-br ${bubble.color} flex items-center justify-center shadow-lg border-2 border-white/30 backdrop-blur-sm hover:scale-110 active:scale-95 transition-transform`}
                                style={{ width: bubble.size, height: bubble.size }}
                            >
                                <span className="font-bold text-white text-center text-sm px-2 drop-shadow-md">
                                    {bubble.text}
                                </span>
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
