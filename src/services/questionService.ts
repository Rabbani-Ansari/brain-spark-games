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

export interface StudentProfileData {
  grade: string;
  board: string;
  preferredLanguage: string;
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
  questionCount: number = 5,
  studentProfile?: StudentProfileData
): Promise<GenerateQuestionsResponse> => {
  const { data, error } = await supabase.functions.invoke('generate-questions', {
    body: {
      subject,
      topic,
      difficulty,
      recentPerformance,
      questionCount,
      grade: studentProfile?.grade,
      board: studentProfile?.board,
      language: studentProfile?.preferredLanguage || 'en'
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

// Fallback questions for when AI is unavailable - EXPANDED for instant gameplay
export const getFallbackQuestions = (subject: string, difficulty: number, count: number = 10): Question[] => {
  if (subject === 'Mathematics') {
    return generateMathQuestions(difficulty, count);
  }
  return generateScienceQuestions(difficulty, count);
};

const generateMathQuestions = (difficulty: number, count: number): Question[] => {
  const questions: Question[] = [];
  const operations = difficulty > 3 ? ['+', '-', '×', '÷'] : ['+', '-', '×'];

  for (let i = 0; i < count; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const maxNum = Math.min(5 + difficulty * 8, 100);

    let a: number, b: number, answer: number, questionText: string;

    switch (operation) {
      case '+':
        a = Math.floor(Math.random() * maxNum) + 1;
        b = Math.floor(Math.random() * maxNum) + 1;
        answer = a + b;
        questionText = `${a} + ${b} = ?`;
        break;
      case '-':
        a = Math.floor(Math.random() * maxNum) + 10;
        b = Math.floor(Math.random() * Math.min(a - 1, maxNum)) + 1;
        answer = a - b;
        questionText = `${a} - ${b} = ?`;
        break;
      case '×':
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        answer = a * b;
        questionText = `${a} × ${b} = ?`;
        break;
      case '÷':
        b = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 10) + 1;
        a = b * answer;
        questionText = `${a} ÷ ${b} = ?`;
        break;
      default:
        a = 1; b = 1; answer = 2;
        questionText = `${a} + ${b} = ?`;
    }

    const wrongAnswers = new Set<number>();
    while (wrongAnswers.size < 3) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const wrong = answer + (offset === 0 ? (Math.random() > 0.5 ? 1 : -1) : offset);
      if (wrong !== answer && wrong > 0) {
        wrongAnswers.add(wrong);
      }
    }

    const options = [answer, ...Array.from(wrongAnswers)].sort(() => Math.random() - 0.5);

    questions.push({
      id: `math-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
      question: questionText,
      options: options.map(String),
      correctIndex: options.indexOf(answer),
      explanation: `The answer is ${answer}`,
      difficulty
    });
  }

  return questions;
};

const scienceQuestionBank = [
  { question: "What is the chemical symbol for water?", options: ["H2O", "CO2", "NaCl", "O2"], correctIndex: 0, explanation: "Water is H2O - 2 hydrogen atoms and 1 oxygen atom" },
  { question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1, explanation: "Mars appears red due to iron oxide on its surface" },
  { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Cytoplasm"], correctIndex: 1, explanation: "Mitochondria produce energy (ATP) for the cell" },
  { question: "What force keeps planets in orbit?", options: ["Magnetism", "Friction", "Gravity", "Electricity"], correctIndex: 2, explanation: "Gravity is the force of attraction between masses" },
  { question: "What gas do plants absorb?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctIndex: 2, explanation: "Plants use CO2 for photosynthesis" },
  { question: "How many bones are in the human body?", options: ["106", "206", "306", "406"], correctIndex: 1, explanation: "An adult human has 206 bones" },
  { question: "What is the largest organ in the human body?", options: ["Heart", "Liver", "Skin", "Brain"], correctIndex: 2, explanation: "Skin is the largest organ by surface area" },
  { question: "What is the boiling point of water?", options: ["50°C", "100°C", "150°C", "200°C"], correctIndex: 1, explanation: "Water boils at 100°C (212°F) at sea level" },
  { question: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], correctIndex: 2, explanation: "Mercury is the closest planet to the Sun" },
  { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], correctIndex: 2, explanation: "Diamond is the hardest natural substance" },
  { question: "How many legs does a spider have?", options: ["6", "8", "10", "12"], correctIndex: 1, explanation: "Spiders are arachnids with 8 legs" },
  { question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correctIndex: 2, explanation: "Au comes from the Latin word 'Aurum'" },
  { question: "What gas do humans need to breathe?", options: ["Nitrogen", "Carbon Dioxide", "Oxygen", "Helium"], correctIndex: 2, explanation: "Humans need oxygen to survive" },
  { question: "What is the speed of light?", options: ["300 km/s", "3,000 km/s", "300,000 km/s", "3,000,000 km/s"], correctIndex: 2, explanation: "Light travels at about 300,000 km per second" },
  { question: "Which is the largest planet?", options: ["Saturn", "Jupiter", "Neptune", "Uranus"], correctIndex: 1, explanation: "Jupiter is the largest planet in our solar system" },
];

const generateScienceQuestions = (difficulty: number, count: number): Question[] => {
  // Shuffle and pick random questions
  const shuffled = [...scienceQuestionBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q, i) => ({
    ...q,
    id: `science-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    difficulty
  }));
};

