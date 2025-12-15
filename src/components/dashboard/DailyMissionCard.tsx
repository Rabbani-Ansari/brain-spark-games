import { motion } from "framer-motion";
import { CheckCircle2, Circle, Star, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDailyPlan } from "@/hooks/useDailyPlan";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

export const DailyMissionCard = () => {
    const { dailyMission, completeTask } = useDailyPlan();
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        if (dailyMission?.completed && !showCelebration) {
            setShowCelebration(true);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [dailyMission?.completed]);

    if (!dailyMission) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-surface rounded-3xl p-6 border border-border overflow-hidden relative"
        >
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-gold" />
                    <span className="text-sm font-semibold text-gold">Daily Challenge</span>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-4">
                    {dailyMission.completed ? "Mission Accomplished! 🎉" : dailyMission.title}
                </h2>

                {dailyMission.completed ? (
                    <div className="py-4">
                        <p className="text-muted-foreground mb-4">You've crushed today's goals. Come back tomorrow for more!</p>
                        <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 p-3 rounded-xl w-fit">
                            <Trophy className="w-5 h-5" />
                            <span>+50 Bonus XP Earned</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 mb-6">
                        {dailyMission.tasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => !task.isCompleted && completeTask(task.id)}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${task.isCompleted
                                        ? "bg-primary/5 border-primary/20"
                                        : "bg-background/50 border-border hover:border-primary/50"
                                    }`}
                            >
                                <div className={`mt-0.5 ${task.isCompleted ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`}>
                                    {task.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                        {task.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Button (Optional logic: e.g. navigate to subject) */}
                {!dailyMission.completed && (
                    <Button variant="gold" className="w-full sm:w-auto group">
                        Start Mission
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                )}
            </div>

            {/* Decorative rocket */}
            <motion.div
                className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-10 pointer-events-none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.1, scale: 1 }}
            >
                🚀
            </motion.div>
        </motion.div>
    );
};
