import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Zap, ArrowLeft, Sparkles, Loader2, Swords } from "lucide-react";
import { Button } from "../ui/button";
import { generateQuestions, getFallbackQuestions, Question } from "@/services/questionService";
import { useStudentProfile } from "@/contexts/StudentProfileContext";

interface NumberNinjaGameProps {
    subject: string;
    onExit: (score: number, xpEarned: number) => void;
}

interface FlyingObject {
    id: string;
    text: string;
    index: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    sliced: boolean;
    isCorrect: boolean;
}

export const NumberNinjaGame = ({ subject, onExit }: NumberNinjaGameProps) => {
    const { profile } = useStudentProfile();
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    // Start instantly with fallback
    const [questions, setQuestions] = useState<Question[]>(() =>
        getFallbackQuestions(subject, 3, 12)
    );
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [flyingObjects, setFlyingObjects] = useState<FlyingObject[]>([]);
    const [isLoading, setIsLoading] = useState(false); // No loading!
    const [gameOver, setGameOver] = useState(false);
    const [sliceTrail, setSliceTrail] = useState<{ x: number, y: number }[]>([]);
    const [sliceEffects, setSliceEffects] = useState<{ x: number, y: number, correct: boolean }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const isSlicingRef = useRef(false);

    const currentQuestion = questions[currentQuestionIndex];

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
                12, studentProfileData
            );
            if (currentQuestionIndex === 0) {
                setQuestions(response.questions);
            }
        } catch (error) {
            console.log("Using fallback questions");
        }
    };

    // Spawn flying objects
    useEffect(() => {
        if (!currentQuestion || gameOver || isLoading) return;

        const objects: FlyingObject[] = currentQuestion.options.map((option, index) => {
            const startSide = Math.random() > 0.5;
            return {
                id: `${currentQuestionIndex}-${index}`,
                text: option,
                index,
                x: startSide ? -10 : 110,
                y: 70 + Math.random() * 20,
                vx: startSide ? 1.5 + Math.random() : -(1.5 + Math.random()),
                vy: -(3 + Math.random() * 2),
                rotation: Math.random() * 360,
                sliced: false,
                isCorrect: index === currentQuestion.correctIndex
            };
        });

        // Stagger the spawning
        objects.forEach((obj, i) => {
            setTimeout(() => {
                setFlyingObjects(prev => [...prev, obj]);
            }, i * 300);
        });

    }, [currentQuestionIndex, currentQuestion, gameOver, isLoading]);

    // Physics animation
    useEffect(() => {
        if (gameOver || isLoading) return;

        const gravity = 0.15;

        const animate = () => {
            setFlyingObjects(prev => {
                const updated = prev.map(obj => {
                    if (obj.sliced) return obj;

                    return {
                        ...obj,
                        x: obj.x + obj.vx,
                        y: obj.y + obj.vy,
                        vy: obj.vy + gravity,
                        rotation: obj.rotation + obj.vx * 5
                    };
                });

                // Check for objects that fell off screen
                const active = updated.filter(obj => {
                    if (obj.sliced) return true;
                    if (obj.y > 120) {
                        // Correct answer fell - lose a life
                        if (obj.isCorrect && currentQuestion) {
                            handleMissedCorrect();
                        }
                        return false;
                    }
                    return true;
                });

                return active;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [gameOver, isLoading, currentQuestion]);

    const handleMissedCorrect = useCallback(() => {
        setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) setGameOver(true);
            return newLives;
        });
        setCombo(0);

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setFlyingObjects([]);
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setGameOver(true);
            }
        }, 500);
    }, [currentQuestionIndex, questions.length]);

    const handleSlice = useCallback((obj: FlyingObject, clientX: number, clientY: number) => {
        if (obj.sliced || gameOver) return;

        // Calculate position for effect
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;
            setSliceEffects(prev => [...prev, { x, y, correct: obj.isCorrect }]);
            setTimeout(() => setSliceEffects(prev => prev.slice(1)), 400);
        }

        setFlyingObjects(prev => prev.map(o =>
            o.id === obj.id ? { ...o, sliced: true } : o
        ));

        if (obj.isCorrect) {
            const comboBonus = combo * 25;
            setScore(prev => prev + 150 + comboBonus);
            setCombo(prev => {
                const newCombo = prev + 1;
                setMaxCombo(max => Math.max(max, newCombo));
                return newCombo;
            });

            setTimeout(() => {
                setFlyingObjects([]);
                if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                } else {
                    setGameOver(true);
                }
            }, 300);
        } else {
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) setGameOver(true);
                return newLives;
            });
            setCombo(0);
        }
    }, [gameOver, combo, currentQuestionIndex, questions.length]);

    // Touch/mouse handling for slicing
    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isSlicingRef.current) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setSliceTrail(prev => [...prev.slice(-10), { x, y }]);

        // Check for collisions with flying objects
        flyingObjects.forEach(obj => {
            if (obj.sliced) return;
            const distance = Math.sqrt(
                Math.pow(x - obj.x, 2) + Math.pow(y - obj.y, 2)
            );
            if (distance < 12) {
                handleSlice(obj, e.clientX, e.clientY);
            }
        });
    }, [flyingObjects, handleSlice]);

    const handlePointerDown = () => {
        isSlicingRef.current = true;
        setSliceTrail([]);
    };

    const handlePointerUp = () => {
        isSlicingRef.current = false;
        setSliceTrail([]);
    };

    const calculateXP = () => {
        const baseXP = score / 10;
        const comboBonus = maxCombo * 5;
        return Math.floor(baseXP + comboBonus);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-orange-900/20 to-background flex flex-col items-center justify-center p-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mb-6"
                >
                    <Swords className="w-16 h-16 text-orange-500" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground mb-2">Loading Number Ninja...</h2>
                <p className="text-muted-foreground text-center">Sharpen your blade! ⚔️</p>
            </div>
        );
    }

    if (gameOver) {
        const xpEarned = calculateXP();

        return (
            <motion.div
                className="min-h-screen bg-gradient-to-b from-orange-900/20 to-background flex flex-col items-center justify-center p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <motion.div
                    className="text-center w-full max-w-sm"
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                >
                    <motion.div
                        className="text-6xl mb-6"
                        animate={{ rotate: [0, -20, 20, 0] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                    >
                        ⚔️
                    </motion.div>

                    <h2 className="text-3xl font-extrabold gradient-text mb-2">
                        {lives > 0 ? "Ninja Master!" : "Game Over!"}
                    </h2>

                    <div className="bg-card rounded-2xl p-6 mb-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Final Score</span>
                            <span className="text-2xl font-bold text-foreground">{score}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Max Combo</span>
                            <span className="text-xl font-bold text-orange-500">{maxCombo}x</span>
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
        <div className="min-h-screen bg-gradient-to-b from-orange-900/20 to-background flex flex-col overflow-hidden select-none">
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
                            className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 rounded-xl"
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
                    className="bg-card/80 backdrop-blur rounded-2xl p-4 text-center border-2 border-orange-500/50"
                >
                    <p className="text-xs text-orange-400 mb-1">Slice the correct answer! ⚔️</p>
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
                            className={`h-1 flex-1 rounded-full ${i < currentQuestionIndex ? 'bg-orange-500' : i === currentQuestionIndex ? 'bg-orange-500/50' : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Game Area */}
            <div
                ref={containerRef}
                className="flex-1 relative overflow-hidden touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Slice trail */}
                {sliceTrail.length > 1 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                        <motion.path
                            d={`M ${sliceTrail.map(p => `${p.x}% ${p.y}%`).join(' L ')}`}
                            stroke="url(#sliceGradient)"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 1 }}
                            animate={{ pathLength: 1, opacity: 0.8 }}
                        />
                        <defs>
                            <linearGradient id="sliceGradient">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                        </defs>
                    </svg>
                )}

                {/* Slice effects */}
                <AnimatePresence>
                    {sliceEffects.map((effect, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 2, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute pointer-events-none z-30"
                            style={{ left: `${effect.x}%`, top: `${effect.y}%` }}
                        >
                            <div className={`text-4xl ${effect.correct ? '' : 'grayscale'}`}>
                                {effect.correct ? '💥' : '❌'}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Flying objects */}
                <AnimatePresence>
                    {flyingObjects.filter(o => !o.sliced).map((obj) => (
                        <motion.div
                            key={obj.id}
                            initial={{ scale: 0 }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                                rotate: obj.rotation
                            }}
                            exit={{
                                scale: 1.5,
                                opacity: 0,
                                transition: { duration: 0.2 }
                            }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                                left: `${obj.x}%`,
                                top: `${obj.y}%`,
                            }}
                        >
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl px-4 py-3 min-w-[70px] text-center shadow-lg border-2 border-orange-300">
                                <span className="font-bold text-white">{obj.text}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Sliced objects (falling halves) */}
                {flyingObjects.filter(o => o.sliced).map((obj) => (
                    <motion.div
                        key={`sliced-${obj.id}`}
                        initial={{ opacity: 1 }}
                        animate={{
                            opacity: 0,
                            y: 100,
                            rotate: obj.rotation + 180
                        }}
                        transition={{ duration: 0.5 }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: `${obj.x}%`,
                            top: `${obj.y}%`,
                        }}
                    >
                        <div className={`rounded-xl px-3 py-2 ${obj.isCorrect ? 'bg-accent' : 'bg-destructive'}`}>
                            <span className="font-bold text-white text-sm">{obj.text}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
