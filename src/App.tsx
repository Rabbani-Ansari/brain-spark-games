import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StudentProfileProvider } from "@/contexts/StudentProfileContext";
import { ChapterProgressProvider } from "@/contexts/ChapterProgressContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

import { MistakeProvider } from "@/contexts/MistakeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StudentProfileProvider>
        <ChapterProgressProvider>
          <MistakeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<OnboardingFlow />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </MistakeProvider>
        </ChapterProgressProvider>
      </StudentProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
