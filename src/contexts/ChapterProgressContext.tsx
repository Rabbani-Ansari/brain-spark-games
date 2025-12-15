import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ChapterStatus = 'Not Started' | 'Weak' | 'Improving' | 'Strong';

export interface ChapterStats {
    totalAttempts: number;
    correctAnswers: number;
    status: ChapterStatus;
}

// Map: Subject -> Chapter Name -> Stats
export type ProgressMap = Record<string, Record<string, ChapterStats>>;

interface ChapterProgressContextType {
    progress: ProgressMap;
    updateProgress: (subject: string, chapter: string, isCorrect: boolean) => void;
    getChapterStats: (subject: string, chapter: string) => ChapterStats;
}

const STORAGE_KEY = 'chapter_progress';

const ChapterProgressContext = createContext<ChapterProgressContextType | undefined>(undefined);

export const ChapterProgressProvider = ({ children }: { children: ReactNode }) => {
    const [progress, setProgress] = useState<ProgressMap>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading chapter progress:', error);
            return {};
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (error) {
            console.error('Error saving chapter progress:', error);
        }
    }, [progress]);

    const calculateStatus = (attempts: number, correct: number): ChapterStatus => {
        if (attempts < 20) return 'Not Started'; // Or 'In Progress' / 'Insufficient Data'
        const accuracy = (correct / attempts) * 100;
        if (accuracy < 50) return 'Weak';
        if (accuracy < 75) return 'Improving';
        return 'Strong';
    };

    const updateProgress = (subject: string, chapter: string, isCorrect: boolean) => {
        setProgress(prev => {
            const subjectStats = prev[subject] || {};
            const currentStats = subjectStats[chapter] || { totalAttempts: 0, correctAnswers: 0, status: 'Not Started' };

            const newAttempts = currentStats.totalAttempts + 1;
            const newCorrect = currentStats.correctAnswers + (isCorrect ? 1 : 0);
            const newStatus = calculateStatus(newAttempts, newCorrect);

            return {
                ...prev,
                [subject]: {
                    ...subjectStats,
                    [chapter]: {
                        totalAttempts: newAttempts,
                        correctAnswers: newCorrect,
                        status: newStatus
                    }
                }
            };
        });
    };

    const getChapterStats = (subject: string, chapter: string): ChapterStats => {
        return progress[subject]?.[chapter] || { totalAttempts: 0, correctAnswers: 0, status: 'Not Started' };
    };

    return (
        <ChapterProgressContext.Provider value={{ progress, updateProgress, getChapterStats }}>
            {children}
        </ChapterProgressContext.Provider>
    );
};

export const useChapterProgress = () => {
    const context = useContext(ChapterProgressContext);
    if (!context) {
        throw new Error('useChapterProgress must be used within ChapterProgressProvider');
    }
    return context;
};
