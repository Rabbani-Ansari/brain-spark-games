import { motion } from 'framer-motion';
import { Languages, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudentProfile, Language } from '@/contexts/StudentProfileContext';

interface LanguageSelectionProps {
    onNext: () => void;
    onBack: () => void;
}

const languages: { value: Language; label: string; native: string; emoji: string }[] = [
    { value: 'en', label: 'English', native: 'English', emoji: '🇬🇧' },
    { value: 'hi', label: 'Hindi', native: 'हिंदी', emoji: '🇮🇳' },
    { value: 'mr', label: 'Marathi', native: 'मराठी', emoji: '🏵️' },
];

export const LanguageSelection = ({ onNext, onBack }: LanguageSelectionProps) => {
    const { profile, updateLanguage } = useStudentProfile();

    const handleLanguageSelect = (language: Language) => {
        updateLanguage(language);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto"
                >
                    <Languages className="w-8 h-8 text-accent" />
                </motion.div>
                <h1 className="text-2xl font-bold text-foreground">
                    Choose your language
                </h1>
                <p className="text-muted-foreground">
                    Questions will be in this language
                </p>
            </div>

            {/* Language Options */}
            <div className="space-y-3">
                {languages.map((language, index) => (
                    <motion.button
                        key={language.value}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        onClick={() => handleLanguageSelect(language.value)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 ${profile.preferredLanguage === language.value
                                ? 'border-primary bg-primary/10 scale-[1.02]'
                                : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-3xl">{language.emoji}</div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-foreground text-lg">
                                    {language.native}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {language.label}
                                </div>
                            </div>
                            {profile.preferredLanguage === language.value && (
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                            )}
                        </div>
                    </motion.button>
                ))}
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
                    Let's Go!
                    <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
            </motion.div>
        </div>
    );
};
