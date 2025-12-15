import { motion } from 'framer-motion';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudentProfile, Grade } from '@/contexts/StudentProfileContext';

interface GradeSelectionProps {
    onNext: () => void;
}

const grades: { value: Grade; label: string; emoji: string }[] = [
    { value: '6', label: 'Class 6', emoji: '💫' },
    { value: '7', label: 'Class 7', emoji: '🔥' },
    { value: '8', label: 'Class 8', emoji: '🏆' },
    { value: '9', label: 'Class 9', emoji: '⚡' },
    { value: '10', label: 'Class 10', emoji: '🎓' },
];

export const GradeSelection = ({ onNext }: GradeSelectionProps) => {
    const { profile, updateGrade } = useStudentProfile();

    const handleGradeSelect = (grade: Grade) => {
        updateGrade(grade);
    };

    const canProceed = profile.grade !== null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
                >
                    <GraduationCap className="w-8 h-8 text-primary" />
                </motion.div>
                <h1 className="text-2xl font-bold text-foreground">
                    Which class are you studying in?
                </h1>
                <p className="text-muted-foreground">
                    This helps us give you the right questions
                </p>
            </div>

            {/* Grade Grid */}
            <div className="grid grid-cols-2 gap-3">
                {grades.map((grade, index) => (
                    <motion.button
                        key={grade.value}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        onClick={() => handleGradeSelect(grade.value)}
                        className={`p-4 rounded-2xl border-2 transition-all duration-200 ${profile.grade === grade.value
                            ? 'border-primary bg-primary/10 scale-105'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                            }`}
                    >
                        <div className="text-3xl mb-2">{grade.emoji}</div>
                        <div className="font-semibold text-foreground">{grade.label}</div>
                    </motion.button>
                ))}
            </div>

            {/* Next Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: canProceed ? 1 : 0.5 }}
                transition={{ delay: 0.5 }}
            >
                <Button
                    onClick={onNext}
                    disabled={!canProceed}
                    className="w-full h-14 text-lg"
                    variant="default"
                >
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
            </motion.div>

            <p className="text-xs text-center text-muted-foreground px-4 mt-8">
                This app is currently optimized for Classes 6–10 (Maharashtra Board) to ensure high-quality, exam-aligned learning.
            </p>
        </div>
    );
};
