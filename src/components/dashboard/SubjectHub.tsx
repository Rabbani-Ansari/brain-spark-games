import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Rocket,
    Crosshair,
    Gamepad2,
    Swords,
    ChevronRight,
    Sparkles,
    Dumbbell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameModeCard } from "@/components/GameModeCard";
import { ChatInterface } from "@/components/ai-chat/ChatInterface";
import { StudentContext } from "@/services/doubtSolverService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SubjectHubProps {
    subject: string;
    onBack: () => void;
    onGameSelect: (mode: string) => void;
    context: StudentContext;
}

export const SubjectHub = ({ subject, onBack, onGameSelect, context }: SubjectHubProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-screen flex flex-col bg-background"
        >
            {/* Header */}
            <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                    >
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{subject}</h1>
                        <p className="text-xs text-muted-foreground">AI Tutor & Practice Hub</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-4">
                <Tabs defaultValue="tutor" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="tutor" className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            AI Tutor
                        </TabsTrigger>
                        <TabsTrigger value="practice" className="flex items-center gap-2">
                            <Dumbbell className="w-4 h-4" />
                            Practice
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tutor" className="flex-1 flex flex-col min-h-0 data-[state=active]:flex">
                        <div className="flex-1 border rounded-2xl overflow-hidden bg-card shadow-sm">
                            <ChatInterface
                                isOpen={true}
                                onClose={() => { }} // No-op for embedded
                                context={context}
                                variant="embedded"
                                initialMessage={`Hello! I want to learn ${subject}.`}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="practice" className="space-y-4 pb-24">
                        <div className="grid gap-4">
                            <GameModeCard
                                title="🚀 Rocket Mode"
                                description="Race against time! Correct answers boost your rocket"
                                icon={Rocket}
                                gradient="bg-gradient-primary"
                                onClick={() => onGameSelect('rocket')}
                            />

                            <GameModeCard
                                title="🎯 Tap Race"
                                description="Quick reflexes! Tap falling answers before they hit bottom"
                                icon={Crosshair}
                                gradient="bg-gradient-secondary"
                                onClick={() => onGameSelect('taprace')}
                            />

                            <GameModeCard
                                title="🫧 Bubble Pop"
                                description="Pop the bubbles with correct answers!"
                                icon={Gamepad2}
                                gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
                                onClick={() => onGameSelect('bubblepop')}
                            />

                            <GameModeCard
                                title="🃏 Memory Match"
                                description="Match questions with their answers"
                                icon={Gamepad2}
                                gradient="bg-gradient-to-br from-purple-500 to-pink-500"
                                onClick={() => onGameSelect('memory')}
                            />

                            <GameModeCard
                                title="⚔️ Number Ninja"
                                description="Slice through correct answers like a ninja!"
                                icon={Swords}
                                gradient="bg-gradient-to-br from-orange-500 to-red-500"
                                onClick={() => onGameSelect('ninja')}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </motion.div>
    );
};
