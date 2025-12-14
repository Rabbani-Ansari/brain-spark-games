import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, RotateCcw, Sparkles, Loader2, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { generateQuestions, getFallbackQuestions, Question } from "@/services/questionService";
import { useStudentProfile } from "@/contexts/StudentProfileContext";

interface MemoryMatchGameProps {
    subject: string;
    onExit: (score: number, xpEarned: number) => void;
}

interface Card {
    id: string;
    content: string;
    type: 'question' | 'answer';
    pairId: number;
    isFlipped: boolean;
    isMatched: boolean;
}

export const MemoryMatchGame = ({ subject, onExit }: MemoryMatchGameProps) => {
    const { profile } = useStudentProfile();
    const [score, setScore] = useState(0);
    const [moves, setMoves] = useState(0);
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<string[]>([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [isLoading, setIsLoading] = useState(false); // No loading!
    const [gameOver, setGameOver] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);

    const totalPairs = 6;

    // Start instantly with fallback, try AI in background
    useEffect(() => {
        createCards(getFallbackQuestions(subject, 2, totalPairs));
        loadAIInBackground();
    }, []);

    // Timer
    useEffect(() => {
        if (cards.length === 0 || gameOver) return;
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [cards.length, gameOver]);

    const loadAIInBackground = async () => {
        try {
            const studentProfileData = profile.isConfigured ? {
                grade: profile.grade || '5',
                board: profile.board,
                preferredLanguage: profile.preferredLanguage
            } : undefined;

            const response = await generateQuestions(
                subject, undefined, 2,
                { correctAnswers: 0, totalAnswers: 0, averageResponseTime: 5 },
                totalPairs, studentProfileData
            );
            // Only use AI if game hasn't started
            if (moves === 0) {
                createCards(response.questions);
            }
        } catch (error) {
            console.log("Using fallback questions");
        }
    };

    const createCards = (questions: Question[]) => {
        const gameCards: Card[] = [];

        questions.slice(0, totalPairs).forEach((q, index) => {
            // Question card
            gameCards.push({
                id: `q-${index}`,
                content: q.question,
                type: 'question',
                pairId: index,
                isFlipped: false,
                isMatched: false
            });

            // Answer card (correct answer)
            gameCards.push({
                id: `a-${index}`,
                content: q.options[q.correctIndex],
                type: 'answer',
                pairId: index,
                isFlipped: false,
                isMatched: false
            });
        });

        // Shuffle cards
        const shuffled = gameCards.sort(() => Math.random() - 0.5);
        setCards(shuffled);
    };

    const handleCardClick = useCallback((cardId: string) => {
        if (isChecking || gameOver) return;

        const card = cards.find(c => c.id === cardId);
        if (!card || card.isFlipped || card.isMatched) return;
        if (flippedCards.length >= 2) return;

        // Flip the card
        setCards(prev => prev.map(c =>
            c.id === cardId ? { ...c, isFlipped: true } : c
        ));

        const newFlipped = [...flippedCards, cardId];
        setFlippedCards(newFlipped);

        // Check for match when 2 cards are flipped
        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            setIsChecking(true);

            const [firstId, secondId] = newFlipped;
            const firstCard = cards.find(c => c.id === firstId)!;
            const secondCard = cards.find(c => c.id === secondId)!;

            setTimeout(() => {
                if (firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
                    // Match!
                    setCards(prev => prev.map(c =>
                        c.pairId === firstCard.pairId ? { ...c, isMatched: true } : c
                    ));

                    const comboBonus = combo * 25;
                    setScore(prev => prev + 100 + comboBonus);
                    setCombo(prev => {
                        const newCombo = prev + 1;
                        setMaxCombo(max => Math.max(max, newCombo));
                        return newCombo;
                    });
                    setMatchedPairs(prev => {
                        const newMatched = prev + 1;
                        if (newMatched >= totalPairs) {
                            setGameOver(true);
                        }
                        return newMatched;
                    });
                } else {
                    // No match - flip back
                    setCards(prev => prev.map(c =>
                        newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
                    ));
                    setCombo(0);
                }

                setFlippedCards([]);
                setIsChecking(false);
            }, 800);
        }
    }, [cards, flippedCards, isChecking, gameOver, combo]);

    const calculateXP = () => {
        const baseXP = score / 10;
        const speedBonus = Math.max(0, 50 - timer) / 2;
        const efficiencyBonus = Math.max(0, (totalPairs * 2 - moves) * 5);
        return Math.floor(baseXP + speedBonus + efficiencyBonus);
    };

    const calculateStars = () => {
        const perfectMoves = totalPairs;
        const ratio = perfectMoves / moves;
        if (ratio >= 0.8) return 3;
        if (ratio >= 0.5) return 2;
        return 1;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-background flex flex-col items-center justify-center p-6">
                <motion.div
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-6"
                >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <span className="text-3xl">🃏</span>
                    </div>
                </motion.div>
                <h2 className="text-xl font-bold text-foreground mb-2">Loading Memory Match...</h2>
                <p className="text-muted-foreground text-center">Creating your cards!</p>
            </div>
        );
    }

    if (gameOver) {
        const xpEarned = calculateXP();
        const stars = calculateStars();

        return (
            <motion.div
                className="min-h-screen bg-gradient-to-b from-purple-900/20 to-background flex flex-col items-center justify-center p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <motion.div
                    className="text-center w-full max-w-sm"
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                >
                    <motion.div
                        className="text-6xl mb-4"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                    >
                        🎉
                    </motion.div>

                    {/* Stars */}
                    <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3].map(star => (
                            <motion.span
                                key={star}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: star * 0.2 }}
                                className={`text-4xl ${star <= stars ? '' : 'grayscale opacity-30'}`}
                            >
                                ⭐
                            </motion.span>
                        ))}
                    </div>

                    <h2 className="text-3xl font-extrabold gradient-text mb-2">
                        All Matched!
                    </h2>

                    <div className="bg-card rounded-2xl p-6 mb-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Final Score</span>
                            <span className="text-2xl font-bold text-foreground">{score}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Moves</span>
                            <span className="text-xl font-bold text-purple-500">{moves}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Time</span>
                            <span className="text-xl font-bold text-accent">{formatTime(timer)}</span>
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-background flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => onExit(score, calculateXP())}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl">
                        <Clock className="w-4 h-4 text-accent" />
                        <span className="font-bold">{formatTime(timer)}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl">
                        <RotateCcw className="w-4 h-4 text-purple-500" />
                        <span className="font-bold">{moves}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl">
                        <Zap className="w-4 h-4 text-secondary" />
                        <span className="font-bold">{score}</span>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="px-4 py-2">
                <div className="bg-card/50 rounded-xl p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                        Match questions with their correct answers!
                        <span className="text-purple-400 ml-1">{matchedPairs}/{totalPairs} pairs found</span>
                    </p>
                </div>
            </div>

            {/* Card Grid */}
            <div className="flex-1 p-4">
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    {cards.map((card) => (
                        <motion.button
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className="aspect-square perspective-1000"
                            whileTap={{ scale: 0.95 }}
                            disabled={card.isFlipped || card.isMatched || isChecking}
                        >
                            <motion.div
                                className="relative w-full h-full"
                                animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                                transition={{ duration: 0.4 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Card Back */}
                                <div
                                    className={`absolute inset-0 rounded-xl flex items-center justify-center
                    ${card.isMatched ? 'bg-accent/20 border-accent' : 'bg-gradient-to-br from-purple-600 to-pink-500'}
                    border-2 border-purple-400/50 shadow-lg`}
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    <span className="text-3xl">🃏</span>
                                </div>

                                {/* Card Front */}
                                <div
                                    className={`absolute inset-0 rounded-xl p-2 flex items-center justify-center
                    ${card.isMatched ? 'bg-accent/20 border-accent' : 'bg-card border-border'}
                    ${card.type === 'question' ? 'border-primary' : 'border-secondary'}
                    border-2 shadow-lg`}
                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                >
                                    <span className={`text-xs font-medium text-center leading-tight
                    ${card.type === 'question' ? 'text-primary' : 'text-secondary'}`}>
                                        {card.content}
                                    </span>
                                </div>
                            </motion.div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Combo indicator */}
            <AnimatePresence>
                {combo > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2"
                    >
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full">
                            <span className="font-bold text-white">{combo}x Combo! 🔥</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
