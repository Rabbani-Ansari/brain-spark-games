import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Mistake {
    id: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    subject: string;
    topic?: string; // Chapter or specific topic
    timestamp: number;
    attempts: number; // How many times they failed this specific question
    isResolved: boolean;
}

interface MistakeContextType {
    mistakes: Mistake[];
    captureMistake: (data: Omit<Mistake, 'id' | 'timestamp' | 'attempts' | 'isResolved'>) => void;
    resolveMistake: (id: string) => void;
    getDailyMistakes: (count?: number) => Mistake[];
    getMistakeCount: () => number;
}

const MistakeContext = createContext<MistakeContextType | undefined>(undefined);

const STORAGE_KEY = 'student_mistakes';

export const MistakeProvider = ({ children }: { children: ReactNode }) => {
    const [mistakes, setMistakes] = useState<Mistake[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to load mistakes", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
    }, [mistakes]);

    const captureMistake = (data: Omit<Mistake, 'id' | 'timestamp' | 'attempts' | 'isResolved'>) => {
        setMistakes(prev => {
            // Check if this question already exists as an unresolved mistake
            const existingIndex = prev.findIndex(m => m.question === data.question && !m.isResolved);

            if (existingIndex >= 0) {
                // Update existing mistake attempt count
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    attempts: updated[existingIndex].attempts + 1,
                    timestamp: Date.now(), // Update time to show it's recent
                    userAnswer: data.userAnswer // Update with latest wrong answer
                };
                return updated;
            }

            // Create new mistake
            const newMistake: Mistake = {
                id: crypto.randomUUID(),
                ...data,
                timestamp: Date.now(),
                attempts: 1,
                isResolved: false
            };

            return [newMistake, ...prev];
        });
    };

    const resolveMistake = (id: string) => {
        setMistakes(prev => prev.filter(m => m.id !== id));
    };

    const getDailyMistakes = (count = 3) => {
        // Return top N unresolved mistakes, prioritized by attempt count (struggle) or recency
        const unresolved = mistakes.filter(m => !m.isResolved);
        return unresolved.slice(0, count);
    };

    const getMistakeCount = () => mistakes.length;

    return (
        <MistakeContext.Provider value={{ mistakes, captureMistake, resolveMistake, getDailyMistakes, getMistakeCount }}>
            {children}
        </MistakeContext.Provider>
    );
};

export const useMistakes = () => {
    const context = useContext(MistakeContext);
    if (context === undefined) {
        throw new Error('useMistakes must be used within a MistakeProvider');
    }
    return context;
};
