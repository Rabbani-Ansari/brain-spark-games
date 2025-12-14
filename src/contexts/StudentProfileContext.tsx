import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Grade = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type Language = 'en' | 'hi' | 'mr';
export type Board = 'maharashtra_state_board';

export interface StudentProfile {
    grade: Grade | null;
    board: Board;
    preferredLanguage: Language;
    isConfigured: boolean;
    currentStep: 1 | 2 | 3 | null;
}

interface StudentProfileContextType {
    profile: StudentProfile;
    updateGrade: (grade: Grade) => void;
    updateLanguage: (language: Language) => void;
    setCurrentStep: (step: 1 | 2 | 3) => void;
    completeSetup: () => void;
    resetProfile: () => void;
}

const STORAGE_KEY = 'student_profile';

const defaultProfile: StudentProfile = {
    grade: null,
    board: 'maharashtra_state_board',
    preferredLanguage: 'en',
    isConfigured: false,
    currentStep: null,
};

const StudentProfileContext = createContext<StudentProfileContextType | undefined>(undefined);

export const StudentProfileProvider = ({ children }: { children: ReactNode }) => {
    const [profile, setProfile] = useState<StudentProfile>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...defaultProfile, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Error loading student profile:', error);
        }
        return defaultProfile;
    });

    // Persist to localStorage on every change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch (error) {
            console.error('Error saving student profile:', error);
        }
    }, [profile]);

    const updateGrade = (grade: Grade) => {
        setProfile(prev => ({ ...prev, grade }));
    };

    const updateLanguage = (language: Language) => {
        setProfile(prev => ({ ...prev, preferredLanguage: language }));
    };

    const setCurrentStep = (step: 1 | 2 | 3) => {
        setProfile(prev => ({ ...prev, currentStep: step }));
    };

    const completeSetup = () => {
        setProfile(prev => ({
            ...prev,
            isConfigured: true,
            currentStep: null,
        }));
    };

    const resetProfile = () => {
        setProfile(defaultProfile);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <StudentProfileContext.Provider
            value={{
                profile,
                updateGrade,
                updateLanguage,
                setCurrentStep,
                completeSetup,
                resetProfile,
            }}
        >
            {children}
        </StudentProfileContext.Provider>
    );
};

export const useStudentProfile = () => {
    const context = useContext(StudentProfileContext);
    if (!context) {
        throw new Error('useStudentProfile must be used within StudentProfileProvider');
    }
    return context;
};
