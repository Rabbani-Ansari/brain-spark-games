import { useState, useEffect } from 'react';
import { useChapterProgress } from '@/contexts/ChapterProgressContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { ALLOWED_TOPICS } from '@/services/subjectValidator';

export interface DailyTask {
    id: string;
    type: 'chapter' | 'practice' | 'revision';
    description: string;
    isCompleted: boolean;
    actionUrl?: string; // Optional: Link to a specific subject/game
}

export interface DailyMission {
    date: string; // ISO date string YYYY-MM-DD
    title: string;
    tasks: DailyTask[];
    completed: boolean;
}

const STORAGE_KEY = 'daily_mission';

export const useDailyPlan = () => {
    const { progress } = useChapterProgress();
    const { profile } = useStudentProfile();
    const [dailyMission, setDailyMission] = useState<DailyMission | null>(null);

    useEffect(() => {
        generateOrLoadMission();
    }, [progress, profile.isConfigured]); // Re-check when progress updates or profile loads

    const generateOrLoadMission = () => {
        if (!profile.isConfigured) return;

        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem(STORAGE_KEY);

        let mission: DailyMission;

        if (stored) {
            mission = JSON.parse(stored);
            if (mission.date === today) {
                setDailyMission(mission);
                return;
            }
        }

        // Generate new mission
        mission = createNewMission(today);
        setDailyMission(mission);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mission));
    };

    const createNewMission = (date: string): DailyMission => {
        // 1. Analyze Progress
        const weakChapters: { subject: string, chapter: string }[] = [];
        const improvingChapters: { subject: string, chapter: string }[] = [];

        Object.entries(progress).forEach(([subject, chapters]) => {
            Object.entries(chapters).forEach(([chapter, stats]) => {
                if (stats.status === 'Weak') weakChapters.push({ subject, chapter });
                else if (stats.status === 'Improving') improvingChapters.push({ subject, chapter });
            });
        });

        // 2. Select Focus
        let focusTask: DailyTask;
        let practiceTask: DailyTask;

        if (weakChapters.length > 0) {
            // Prioritize Weak: Pick random
            const target = weakChapters[Math.floor(Math.random() * weakChapters.length)];
            focusTask = {
                id: 'task_1',
                type: 'revision',
                description: `Review "${target.chapter}" in ${target.subject}`,
                isCompleted: false
            };
            practiceTask = {
                id: 'task_2',
                type: 'practice',
                description: `Complete a quiz for "${target.chapter}"`,
                isCompleted: false
            };
        } else if (improvingChapters.length > 0) {
            // Prioritize Improving
            const target = improvingChapters[Math.floor(Math.random() * improvingChapters.length)];
            focusTask = {
                id: 'task_1',
                type: 'chapter',
                description: `Master "${target.chapter}" in ${target.subject}`,
                isCompleted: false
            };
            practiceTask = {
                id: 'task_2',
                type: 'practice',
                description: `Play a game in ${target.subject} to boost XP`,
                isCompleted: false
            };
        } else {
            // Fallback: Pick a random subject from allowed topics
            const boardName = profile.board === 'maharashtra_state_board' ? 'Maharashtra State Board' : profile.board;
            const gradeNum = parseInt(profile.grade || '6');
            const subjects = ALLOWED_TOPICS[boardName]?.[gradeNum] || ['Mathematics', 'Science'];
            const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

            focusTask = {
                id: 'task_1',
                type: 'chapter',
                description: `Start a new chapter in ${randomSubject}`,
                isCompleted: false
            };
            practiceTask = {
                id: 'task_2',
                type: 'practice',
                description: `Play a quick game in ${randomSubject}`,
                isCompleted: false
            };
        }

        return {
            date: date,
            title: getRandomTitle(),
            tasks: [focusTask, practiceTask],
            completed: false
        };
    };

    const getRandomTitle = () => {
        const titles = [
            "Today's Brain Boost 🚀",
            "Your Daily Mission 🎯",
            "Level Up Plan ⚡",
            "Study Streak Goal 🔥"
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    };

    const completeTask = (taskId: string) => {
        if (!dailyMission) return;

        const updatedTasks = dailyMission.tasks.map(t =>
            t.id === taskId ? { ...t, isCompleted: true } : t
        );

        const allCompleted = updatedTasks.every(t => t.isCompleted);

        const updatedMission = {
            ...dailyMission,
            tasks: updatedTasks,
            completed: allCompleted
        };

        setDailyMission(updatedMission);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMission));
    };

    return { dailyMission, completeTask };
};
