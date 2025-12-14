import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudentProfile } from '@/contexts/StudentProfileContext';

interface SetupCompleteProps {
    onComplete: () => void;
}

export const SetupComplete = ({ onComplete }: SetupCompleteProps) => {
    const { profile } = useStudentProfile();

    // Auto-redirect after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    const gradeLabel = profile.grade ? `Class ${profile.grade}` : '';
    const languageLabel =
        profile.preferredLanguage === 'en' ? 'English' :
            profile.preferredLanguage === 'hi' ? 'Hindi' :
                'Marathi';

    return (
        <div className="text-center space-y-8">
            {/* Celebration Animation */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="relative mx-auto w-32 h-32"
            >
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-xl animate-pulse" />

                {/* Main rocket */}
                <div className="relative w-full h-full bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Rocket className="w-16 h-16 text-white rotate-[-45deg]" />
                    </motion.div>
                </div>

                {/* Sparkles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                        className="absolute"
                        style={{
                            top: `${20 + Math.random() * 60}%`,
                            left: `${10 + Math.random() * 80}%`,
                        }}
                    >
                        <Sparkles className="w-4 h-4 text-gold" />
                    </motion.div>
                ))}
            </motion.div>

            {/* Success Message */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
            >
                <h1 className="text-3xl font-bold text-foreground">
                    You're ready to play! 🎉
                </h1>
                <p className="text-muted-foreground text-lg">
                    Your personalized learning journey begins now
                </p>
            </motion.div>

            {/* Profile Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card rounded-2xl p-4 border border-border"
            >
                <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="text-center">
                        <div className="text-muted-foreground">Grade</div>
                        <div className="font-semibold text-foreground">{gradeLabel}</div>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                        <div className="text-muted-foreground">Board</div>
                        <div className="font-semibold text-foreground">Maharashtra</div>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                        <div className="text-muted-foreground">Language</div>
                        <div className="font-semibold text-foreground">{languageLabel}</div>
                    </div>
                </div>
            </motion.div>

            {/* Start Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
            >
                <Button
                    onClick={onComplete}
                    size="lg"
                    className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                    Start Playing
                    <Rocket className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                    Auto-redirecting in 3 seconds...
                </p>
            </motion.div>
        </div>
    );
};
