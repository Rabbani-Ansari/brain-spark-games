import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2 } from "lucide-react";
import { useMistakes } from "@/contexts/MistakeContext";
import { MistakeCard } from "./MistakeCard";

export const MistakeVault = () => {
    const { getDailyMistakes, getMistakeCount } = useMistakes();
    const mistakes = getDailyMistakes(10); // Show up to 10
    const totalMistakes = getMistakeCount();

    if (mistakes.length === 0) return null;

    return (
        <section className="px-5 py-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-red-500" />
                    <h3 className="text-xl font-bold text-foreground">Revision Zone</h3>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {totalMistakes} to fix
                </span>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
                Learning happens here. Fix these mistakes to boost your score! 🚀
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mistakes.map((mistake) => (
                    <MistakeCard key={mistake.id} mistake={mistake} />
                ))}
            </div>

            {totalMistakes > mistakes.length && (
                <p className="text-center text-xs text-muted-foreground mt-4">
                    +{totalMistakes - mistakes.length} more mistakes waiting...
                </p>
            )}
        </section>
    );
};
