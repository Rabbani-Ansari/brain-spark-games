import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, HelpCircle, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mistake, useMistakes } from "@/contexts/MistakeContext";
import { ChatInterface } from "@/components/ai-chat/ChatInterface";
import { StudentContext } from "@/services/doubtSolverService";
import { useStudentProfile } from "@/contexts/StudentProfileContext";

interface MistakeCardProps {
    mistake: Mistake;
}

export const MistakeCard = ({ mistake }: MistakeCardProps) => {
    const { resolveMistake } = useMistakes();
    const { profile } = useStudentProfile();
    const [showExplanation, setShowExplanation] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isResolving, setIsResolving] = useState(false);

    const handleResolve = () => {
        setIsResolving(true);
        setTimeout(() => {
            resolveMistake(mistake.id);
        }, 500);
    };

    const studentContext: StudentContext = {
        grade: profile.grade || '6',
        board: profile.board,
        subject: mistake.subject,
        chapter: mistake.topic,
        currentQuestion: mistake.question,
        language: profile.preferredLanguage === 'hi' ? 'Hindi' : profile.preferredLanguage === 'mr' ? 'Marathi' : 'English'
    };

    const prompt = `I got this question wrong: "${mistake.question}". I answered "${mistake.userAnswer}" but the correct answer is "${mistake.correctAnswer}". Can you explain why I was wrong and how to find the right answer?`;

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className={`relative bg-card border border-border rounded-2xl p-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isResolving ? 'opacity-0 scale-95' : ''}`}
            >
                <div className="flex items-start gap-4">
                    <div className="mt-1">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{mistake.subject}</span>
                            <span className="text-xs text-red-500 font-medium">{mistake.attempts} attempts</span>
                        </div>

                        <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base leading-snug">
                            {mistake.question}
                        </h4>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-2.5">
                                <p className="text-xs text-muted-foreground mb-1">Your Answer</p>
                                <p className="text-sm font-medium text-red-700 flex items-center gap-1.5 break-words">
                                    <X className="w-3.5 h-3.5 flex-shrink-0" />
                                    {mistake.userAnswer}
                                </p>
                            </div>

                            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-2.5">
                                <p className="text-xs text-muted-foreground mb-1">Correct Answer</p>
                                {showExplanation ? (
                                    <p className="text-sm font-medium text-green-700 flex items-center gap-1.5 break-words">
                                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                        {mistake.correctAnswer}
                                    </p>
                                ) : (
                                    <div
                                        onClick={() => setShowExplanation(true)}
                                        className="h-6 bg-green-500/10 rounded cursor-pointer flex items-center px-2 text-xs text-green-600 font-medium hover:bg-green-500/20 transition-colors"
                                    >
                                        Tap to reveal
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors h-9"
                                onClick={() => setIsChatOpen(true)}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Ask AI Why
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 h-9"
                                onClick={handleResolve}
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                I Got It!
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <ChatInterface
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                context={studentContext}
                initialMessage={prompt}
                variant="bottomsheet"
            />
        </>
    );
};
