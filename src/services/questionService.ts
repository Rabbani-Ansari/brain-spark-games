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
  const normSubject = subject.toLowerCase();

  if (normSubject.includes('math')) {
    return generateMathQuestions(difficulty, count);
  } else if (normSubject.includes('english')) {
    return generateEnglishQuestions(difficulty, count);
  } else if (normSubject.includes('history') || normSubject.includes('civics')) {
    return generateHistoryQuestions(difficulty, count);
  } else if (normSubject.includes('geography')) {
    return generateGeographyQuestions(difficulty, count);
  } else if (normSubject.includes('marathi')) {
    return generateMarathiQuestions(difficulty, count);
  } else if (normSubject.includes('hindi')) {
    return generateHindiQuestions(difficulty, count);
  } else if (normSubject.includes('computer')) {
    return generateComputerQuestions(difficulty, count);
  } else if (normSubject.includes('science') || normSubject.includes('environmental')) {
    return generateScienceQuestions(difficulty, count);
  }

  // Default for Art, PE, etc.
  return generateGeneralQuestions(difficulty, count, subject);
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

const englishQuestionBank = [
  { question: "Which word is a noun?", options: ["Run", "Happy", "Cat", "Quickly"], correctIndex: 2, explanation: "A noun is a person, place, or thing. 'Cat' is a thing." },
  { question: "Identify the verb: 'She sings beautifully.'", options: ["She", "Sings", "Beautifully", "The"], correctIndex: 1, explanation: "A verb is an action word. 'Sings' is the action." },
  { question: "What is the opposite of 'Ancient'?", options: ["Old", "Modern", "Classic", "Antique"], correctIndex: 1, explanation: "'Modern' means new or recent, the opposite of ancient." },
  { question: "Choose the correct spelling.", options: ["Recieve", "Receive", "Receve", "Riceive"], correctIndex: 1, explanation: "'Receive' follows the 'i before e except after c' rule." },
  { question: "What is the plural of 'Child'?", options: ["Childs", "Children", "Childrens", "Childes"], correctIndex: 1, explanation: "The plural of child is children." },
  { question: "Which sentence is correct?", options: ["He don't know.", "He doesn't know.", "He not know.", "He no know."], correctIndex: 1, explanation: "With 'he', we use 'doesn't' (does not)." },
  { question: "Find the adjective: 'The red car is fast.'", options: ["The", "Car", "Red", "Is"], correctIndex: 2, explanation: "Adjectives describe nouns. 'Red' describes the car." },
  { question: "What is a synonym for 'Happy'?", options: ["Sad", "Joyful", "Angry", "Tired"], correctIndex: 1, explanation: "Synonyms are words with similar meanings. 'Joyful' means happy." },
  { question: "Complete the sentence: 'I ___ to the store yesterday.'", options: ["Go", "Gone", "Went", "Going"], correctIndex: 2, explanation: "'Went' is the past tense of go." },
  { question: "Which word is a pronoun?", options: ["Table", "She", "Walk", "Blue"], correctIndex: 1, explanation: "A pronoun replaces a noun. 'She' is a pronoun." },
  { question: "What is the past tense of 'Run'?", options: ["Runned", "Ran", "Running", "Rans"], correctIndex: 1, explanation: "The past tense of run is ran." },
  { question: "Identify the conjunction: 'I like tea and coffee.'", options: ["Like", "Tea", "And", "Coffee"], correctIndex: 2, explanation: "Conjunctions connect words or sentences. 'And' is a conjunction." },
  { question: "What is the opposite of 'Brave'?", options: ["Strong", "Cowardly", "Fearless", "Bold"], correctIndex: 1, explanation: "'Cowardly' means lacking courage, the opposite of brave." },
  { question: "Choose the correct article: '___ apple a day.'", options: ["A", "An", "The", "No article"], correctIndex: 1, explanation: "We use 'an' before words starting with a vowel sound." },
  { question: "Which word is an adverb?", options: ["Fast", "Quickly", "Run", "Boy"], correctIndex: 1, explanation: "Adverbs describe verbs, often ending in -ly. 'Quickly' is an adverb." },
];

const generateEnglishQuestions = (difficulty: number, count: number): Question[] => {
  const shuffled = [...englishQuestionBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q, i) => ({
    ...q,
    id: `english-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    difficulty
  }));
};

// --- NEW QUESTION BANKS ---

// History & Civics
const historyQuestionBank = [
  { question: "Who was the first Prime Minister of India?", options: ["Gandhi", "Nehru", "Modi", "Patel"], correctIndex: 1, explanation: "Jawaharlal Nehru was the first PM of India." },
  { question: "Who was known as Chhatrapati?", options: ["Shivaji Maharaj", "Akbar", "Ashoka", "Prithviraj"], correctIndex: 0, explanation: "Chatrapati Shivaji Maharaj founded the Maratha Empire." },
  { question: "When did India get independence?", options: ["1945", "1947", "1950", "1952"], correctIndex: 1, explanation: "India became independent on August 15, 1947." },
  { question: "Which fort is associated with Shivaji Maharaj's birth?", options: ["Raigad", "Shivneri", "Pratapgad", "Sinhagad"], correctIndex: 1, explanation: "Shivaji Maharaj was born on Shivneri Fort." },
  { question: "What is the supreme law of India?", options: ["The Parliament", "The Constitution", "The President", "The Supreme Court"], correctIndex: 1, explanation: "The Constitution of India is the supreme law." },
  { question: "Who wrote the Indian Constitution?", options: ["Nehru", "Gandhi", "Dr. B.R. Ambedkar", "Bose"], correctIndex: 2, explanation: "Dr. B.R. Ambedkar was the chief architect of the Constitution." },
  { question: "The capital of India is?", options: ["Mumbai", "Kolkata", "New Delhi", "Chennai"], correctIndex: 2, explanation: "New Delhi is the capital of India." },
  { question: "Which movement did Gandhi lead?", options: ["Green Revolution", "Salt March", "Industrial Revolution", "French Revolution"], correctIndex: 1, explanation: "The Salt March was a major non-violent protest led by Gandhi." },
];

const generateHistoryQuestions = (difficulty: number, count: number): Question[] => {
  const shuffled = [...historyQuestionBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q, i) => ({
    ...q,
    id: `history-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    difficulty
  }));
};

// Geography
const geographyQuestionBank = [
  { question: "Which is the longest river in India?", options: ["Yamuna", "Ganga", "Godavari", "Narmada"], correctIndex: 1, explanation: "The Ganga is the longest river in India." },
  { question: "Which direction does the Sun rise?", options: ["West", "North", "East", "South"], correctIndex: 2, explanation: "The Sun rises in the East." },
  { question: "Which state is known for Alphonso mangoes?", options: ["Gujarat", "Maharashtra", "Punjab", "Kerala"], correctIndex: 1, explanation: "Maharashtra (especially Konkan) is famous for Alphonso mangoes." },
  { question: "What is the capital of Maharashtra?", options: ["Pune", "Nagpur", "Mumbai", "Nashik"], correctIndex: 2, explanation: "Mumbai is the capital of Maharashtra." },
  { question: "Which is the largest continent?", options: ["Africa", "Asia", "Europe", "North America"], correctIndex: 1, explanation: "Asia is the largest continent by size and population." },
  { question: "What percentage of Earth is water?", options: ["50%", "29%", "71%", "90%"], correctIndex: 2, explanation: "About 71% of Earth's surface is covered by water." },
  { question: "Which gas is most abundant in air?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Helium"], correctIndex: 2, explanation: "Nitrogen makes up about 78% of the air." },
];

const generateGeographyQuestions = (difficulty: number, count: number): Question[] => {
  const shuffled = [...geographyQuestionBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q, i) => ({
    ...q,
    id: `geo-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    difficulty
  }));
};

// Marathi
const marathiQuestionBank = [
  { question: "'Surya' (सूर्य) means what in English?", options: ["Moon", "Star", "Sun", "Sky"], correctIndex: 2, explanation: "Surya means Sun." },
  { question: "Which is a Marathi month?", options: ["January", "Chaitra", "Sunday", "Winter"], correctIndex: 1, explanation: "Chaitra is the first month of the Hindu calendar utilized in Maharashtra." },
  { question: "'Paani' (पाणी) means?", options: ["Food", "Water", "Air", "Fire"], correctIndex: 1, explanation: "Paani means Water." },
  { question: "What comes after 'Ek' (एक)?", options: ["Teen", "Don", "Chaar", "Paach"], correctIndex: 1, explanation: "Ek is 1, Don is 2." },
  { question: "Which saint wrote Dnyaneshwari?", options: ["Tukaram", "Namdev", "Dnyaneshwar", "Eknath"], correctIndex: 2, explanation: "Saint Dnyaneshwar wrote the Dnyaneshwari." },
];

const generateMarathiQuestions = (difficulty: number, count: number): Question[] => {
  const shuffled = [...marathiQuestionBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q, i) => ({
    ...q,
    id: `marathi-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    difficulty
  }));
};

// Hindi
const hindiQuestionBank = [
  { question: "'Namaste' is used for?", options: ["Sleeping", "Eating", "Greeting", "Running"], correctIndex: 2, explanation: "Namaste is a respectful greeting." },
  { question: "What is 'Kitaab' (किताब)?", options: ["Pen", "Book", "School", "Bag"], correctIndex: 1, explanation: "Kitaab means Book." },
  { question: "Crual means 'Kathor', Kind means?", options: ["Dayalu", "Bura", "Gussa", "Dukhi"], correctIndex: 0, explanation: "Dayalu means Kind." },
  { question: "What color is 'Laal'?", options: ["Blue", "Green", "Red", "Yellow"], correctIndex: 2, explanation: "Laal means Red." },
];

const generateHindiQuestions = (difficulty: number, count: number): Question[] => {
  const shuffled = [...hindiQuestionBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q, i) => ({
    ...q,
    id: `hindi-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    difficulty
  }));
};

// Computer Science
const computerQuestionBank = [
  { question: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Power Unit", "Central Power User", "Core Process Unit"], correctIndex: 0, explanation: "CPU is the Central Processing Unit." },
  { question: "Which is an input device?", options: ["Monitor", "Printer", "Keyboard", "Speaker"], correctIndex: 2, explanation: "A keyboard is used to input data." },
  { question: "What is the brain of the computer?", options: ["Mouse", "CPU", "Screen", "Hard Disk"], correctIndex: 1, explanation: "The CPU is often called the brain of the computer." },
  { question: "RAM stands for?", options: ["Read Access Memory", "Random Access Memory", "Run All Memory", "Read All Morning"], correctIndex: 1, explanation: "RAM is Random Access Memory." },
  { question: "Which is a web browser?", options: ["Windows", "Chrome", "Excel", "Python"], correctIndex: 1, explanation: "Google Chrome is a web browser." },
];

const generateComputerQuestions = (difficulty: number, count: number): Question[] => {
  const shuffled = [...computerQuestionBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q, i) => ({
    ...q,
    id: `comp-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    difficulty
  }));
};

// General
const generateGeneralQuestions = (difficulty: number, count: number, subject: string): Question[] => {
  return [
    {
      id: `gen-${Date.now()}`,
      question: `Ready to learn about ${subject}?`,
      options: ["Yes!", "Definitely", "Sure", "Let's Go"],
      correctIndex: 0,
      explanation: "Great enthusiasm! Let's start learning.",
      difficulty: 1
    },
    ...generateScienceQuestions(difficulty, Math.max(1, count - 1)) // Fill rest with Science/GK for now
  ];
};

