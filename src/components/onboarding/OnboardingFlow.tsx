import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { GradeSelection } from './GradeSelection';
import { BoardSelection } from './BoardSelection';
import { LanguageSelection } from './LanguageSelection';
import { SetupComplete } from './SetupComplete';

type Step = 1 | 2 | 3 | 'complete';

export const OnboardingFlow = () => {
    const navigate = useNavigate();
    const { profile, setCurrentStep, completeSetup } = useStudentProfile();

    // Resume from last step if force-closed, otherwise start from step 1
    const [currentStep, setStep] = useState<Step>(() => {
        if (profile.isConfigured) return 'complete';
        return profile.currentStep || 1;
    });

    // Track step for resume on force-close
    useEffect(() => {
        if (typeof currentStep === 'number') {
            setCurrentStep(currentStep);
        }
    }, [currentStep, setCurrentStep]);

    const handleNext = () => {
        if (currentStep === 1) setStep(2);
        else if (currentStep === 2) setStep(3);
        else if (currentStep === 3) {
            completeSetup();
            setStep('complete');
        }
    };

    const handleBack = () => {
        if (currentStep === 2) setStep(1);
        else if (currentStep === 3) setStep(2);
    };

    const handleComplete = () => {
        navigate('/');
    };

    // If already configured, redirect home
    useEffect(() => {
        if (profile.isConfigured && currentStep !== 'complete') {
            navigate('/');
        }
    }, [profile.isConfigured, navigate, currentStep]);

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Progress indicator */}
            {typeof currentStep === 'number' && (
                <div className="p-5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {[1, 2, 3].map((step) => (
                            <div
                                key={step}
                                className={`h-2 rounded-full transition-all duration-300 ${step === currentStep
                                        ? 'w-8 bg-primary'
                                        : step < currentStep
                                            ? 'w-2 bg-primary/60'
                                            : 'w-2 bg-muted'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        Step {currentStep} of 3
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-5 overflow-hidden">
                <AnimatePresence mode="wait" custom={1}>
                    {currentStep === 1 && (
                        <motion.div
                            key="grade"
                            custom={1}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-md"
                        >
                            <GradeSelection onNext={handleNext} />
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div
                            key="board"
                            custom={1}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-md"
                        >
                            <BoardSelection onNext={handleNext} onBack={handleBack} />
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div
                            key="language"
                            custom={1}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-md"
                        >
                            <LanguageSelection onNext={handleNext} onBack={handleBack} />
                        </motion.div>
                    )}

                    {currentStep === 'complete' && (
                        <motion.div
                            key="complete"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, type: 'spring' }}
                            className="w-full max-w-md"
                        >
                            <SetupComplete onComplete={handleComplete} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
