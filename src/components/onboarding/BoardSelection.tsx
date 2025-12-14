import { motion } from 'framer-motion';
import { Building, ChevronRight, ChevronLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BoardSelectionProps {
    onNext: () => void;
    onBack: () => void;
}

export const BoardSelection = ({ onNext, onBack }: BoardSelectionProps) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto"
                >
                    <Building className="w-8 h-8 text-secondary" />
                </motion.div>
                <h1 className="text-2xl font-bold text-foreground">
                    Your school board
                </h1>
                <p className="text-muted-foreground">
                    Questions follow your syllabus
                </p>
            </div>

            {/* Board Options */}
            <div className="space-y-3">
                {/* Maharashtra Board - Selected */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-2xl border-2 border-primary bg-primary/10"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">📚</span>
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-foreground">Maharashtra State Board</div>
                            <div className="text-sm text-muted-foreground">Selected</div>
                        </div>
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                        </div>
                    </div>
                </motion.div>

                {/* CBSE - Coming Soon */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-2xl border-2 border-border bg-muted/50 opacity-60"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🏛️</span>
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-foreground">CBSE</div>
                            <div className="text-sm text-muted-foreground">Coming soon</div>
                        </div>
                        <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                </motion.div>

                {/* ICSE - Coming Soon */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-2xl border-2 border-border bg-muted/50 opacity-60"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🎓</span>
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-foreground">ICSE</div>
                            <div className="text-sm text-muted-foreground">Coming soon</div>
                        </div>
                        <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                </motion.div>
            </div>

            {/* Navigation Buttons */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex gap-3"
            >
                <Button
                    onClick={onBack}
                    variant="outline"
                    className="flex-1 h-14 text-lg"
                >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    className="flex-1 h-14 text-lg"
                >
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
            </motion.div>
        </div>
    );
};
