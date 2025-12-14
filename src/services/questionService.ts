import { supabase } from "@/integrations/supabase/client";

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
}

export interface PerformanceData {
  correctAnswers: number;
  totalAnswers: number;
  averageResponseTime: number;
}

export interface GenerateQuestionsResponse {
  questions: Question[];
  adjustedDifficulty: number;
  performanceAnalysis: {
    accuracy: number;
    difficultyChange: number;
  };
}

export const generateQuestions = async (
  subject: string,
  topic: string | undefined,
  difficulty: number,
  recentPerformance: PerformanceData,
  questionCount: number = 5
): Promise<GenerateQuestionsResponse> => {
  const { data, error } = await supabase.functions.invoke('generate-questions', {
    body: {
      subject,
      topic,
      difficulty,
      recentPerformance,
      questionCount
    }
  });

  if (error) {
    console.error('Error generating questions:', error);
    throw new Error(error.message || 'Failed to generate questions');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  // Add unique IDs to questions
  const questionsWithIds = data.questions.map((q: Omit<Question, 'id'>, index: number) => ({
    ...q,
    id: `${Date.now()}-${index}`
  }));

  return {
    ...data,
    questions: questionsWithIds
  };
};

// Fallback questions for when AI is unavailable
export const getFallbackQuestions = (subject: string, difficulty: number): Question[] => {
  if (subject === 'Mathematics') {
    return generateMathQuestions(difficulty);
  }
  return generateScienceQuestions(difficulty);
};

const generateMathQuestions = (difficulty: number): Question[] => {
  const questions: Question[] = [];
  const operations = ['+', '-', '×'];
  
  for (let i = 0; i < 5; i++) {
    const operation = operations[Math.floor(Math.random() * (difficulty > 3 ? 3 : 2))];
    const maxNum = Math.min(10 + difficulty * 5, 50);
    
    let a: number, b: number, answer: number;
    
    switch (operation) {
      case '+':
        a = Math.floor(Math.random() * maxNum) + 1;
        b = Math.floor(Math.random() * maxNum) + 1;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * maxNum) + 10;
        b = Math.floor(Math.random() * Math.min(a, maxNum)) + 1;
        answer = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        answer = a * b;
        break;
      default:
        a = 1; b = 1; answer = 2;
    }
    
    const wrongAnswers = new Set<number>();
    while (wrongAnswers.size < 3) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const wrong = answer + (offset === 0 ? 1 : offset);
      if (wrong !== answer && wrong > 0) {
        wrongAnswers.add(wrong);
      }
    }
    
    const options = [answer, ...Array.from(wrongAnswers)].sort(() => Math.random() - 0.5);
    
    questions.push({
      id: `fallback-${Date.now()}-${i}`,
      question: `${a} ${operation} ${b} = ?`,
      options: options.map(String),
      correctIndex: options.indexOf(answer),
      explanation: `${a} ${operation} ${b} equals ${answer}`,
      difficulty
    });
  }
  
  return questions;
};

const generateScienceQuestions = (difficulty: number): Question[] => {
  const scienceQuestions = [
    {
      question: "What is the chemical symbol for water?",
      options: ["H2O", "CO2", "NaCl", "O2"],
      correctIndex: 0,
      explanation: "Water is made of 2 hydrogen atoms and 1 oxygen atom: H2O"
    },
    {
      question: "What planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctIndex: 1,
      explanation: "Mars appears red due to iron oxide (rust) on its surface"
    },
    {
      question: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Cytoplasm"],
      correctIndex: 1,
      explanation: "Mitochondria produce energy (ATP) for the cell"
    },
    {
      question: "What force keeps planets in orbit around the Sun?",
      options: ["Magnetism", "Friction", "Gravity", "Electricity"],
      correctIndex: 2,
      explanation: "Gravity is the force of attraction between masses"
    },
    {
      question: "What gas do plants absorb from the air?",
      options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
      correctIndex: 2,
      explanation: "Plants use CO2 for photosynthesis to make food"
    }
  ];
  
  return scienceQuestions.map((q, i) => ({
    ...q,
    id: `fallback-science-${Date.now()}-${i}`,
    difficulty
  }));
};
