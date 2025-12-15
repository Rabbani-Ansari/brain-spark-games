import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionRequest {
  subject: string;
  topic?: string;
  difficulty: number; // 1-10
  recentPerformance: {
    correctAnswers: number;
    totalAnswers: number;
    averageResponseTime: number; // in seconds
  };
  questionCount: number;
  grade?: string; // Class 1-8
  board?: string; // maharashtra_state_board
  language?: string; // en | hi | mr
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
}

// Grade level descriptions for AI context
const gradeDescriptions: Record<string, string> = {
  '6': 'Class 6 (Ages 11-12): Maharashtra Board (SSC). Algebra basics, ratio/proportion, cell biology, physics intro',
  '7': 'Class 7 (Ages 12-13): Maharashtra Board (SSC). Linear equations, geometry proofs, chemistry basics, motion',
  '8': 'Class 8 (Ages 13-14): Maharashtra Board (SSC). Quadratic equations, trigonometry basics, atoms, force/pressure',
  '9': 'Class 9 (Ages 14-15): Maharashtra Board (SSC). Science part 1 & 2, Geometry, Algebra, History/Civics/Geography',
  '10': 'Class 10 (Ages 15-16): Maharashtra Board (SSC). Board Exam preparation, Advanced Algebra/Geometry, Carbon compounds, Electric current',
};

const languageInstructions: Record<string, string> = {
  'en': 'Generate all content in English.',
  'hi': 'Generate all content in Hindi (Devanagari script). Questions, options, and explanations must be in Hindi.',
  'mr': 'Generate all content in Marathi (Devanagari script). Questions, options, and explanations must be in Marathi.',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { subject, topic, difficulty, recentPerformance, questionCount, grade, board, language } = await req.json() as QuestionRequest;

    // Calculate adaptive difficulty based on performance
    const accuracy = recentPerformance.totalAnswers > 0
      ? recentPerformance.correctAnswers / recentPerformance.totalAnswers
      : 0.5;

    let adjustedDifficulty = difficulty;
    if (accuracy > 0.8) {
      adjustedDifficulty = Math.min(10, difficulty + 1);
    } else if (accuracy < 0.5) {
      adjustedDifficulty = Math.max(1, difficulty - 1);
    }

    // Speed bonus - if answering quickly and correctly, increase difficulty
    if (accuracy > 0.7 && recentPerformance.averageResponseTime < 5) {
      adjustedDifficulty = Math.min(10, adjustedDifficulty + 1);
    }

    // Get grade and language context
    const gradeContext = grade ? gradeDescriptions[grade] || `Class ${grade}` : '';
    const languageInstruction = languageInstructions[language || 'en'] || languageInstructions['en'];
    const boardContext = board === 'maharashtra_state_board'
      ? 'Follow Maharashtra State Board (SSC) syllabus and curriculum standards.'
      : '';

    const prompt = `You are an educational AI generating quiz questions for a game-based learning app targeting students in India.

${languageInstruction}

Student Context:
${gradeContext ? `- Grade Level: ${gradeContext}` : ''}
${boardContext ? `- Curriculum: ${boardContext}` : ''}

Subject: ${subject}
${topic ? `Topic: ${topic}` : ''}
Difficulty Level: ${adjustedDifficulty}/10
Number of Questions: ${questionCount}

Student Performance Context:
- Recent Accuracy: ${(accuracy * 100).toFixed(0)}%
- Average Response Time: ${recentPerformance.averageResponseTime.toFixed(1)}s
${accuracy > 0.8 ? '- Student is performing well, provide slightly harder questions' : ''}
${accuracy < 0.5 ? '- Student is struggling, provide supportive questions with clear concepts' : ''}

Generate ${questionCount} multiple-choice questions following these rules:
1. Each question should have exactly 4 options
2. Questions MUST be appropriate for the student's grade level${grade ? ` (Class ${grade})` : ''}
3. Make questions engaging and relatable to students
4. Include a brief explanation for the correct answer
5. For Mathematics: include arithmetic, algebra, geometry based on grade and difficulty
6. For Science: include physics, chemistry, biology concepts appropriate for the grade

You must respond with a JSON array of questions using this exact format:
[
  {
    "question": "The actual question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this is correct",
    "difficulty": ${adjustedDifficulty}
  }
]

Only output the JSON array, no additional text.`;

    console.log("Generating questions with prompt length:", prompt.length);
    console.log("Subject:", subject, "Difficulty:", adjustedDifficulty, "Count:", questionCount);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an educational quiz generator. Always respond with valid JSON arrays only."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("Raw AI response:", content.substring(0, 200));

    // Parse the JSON response
    let questions: Question[];
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      }
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();

      questions = JSON.parse(cleanedContent);

      // Validate structure
      if (!Array.isArray(questions)) {
        throw new Error("Response is not an array");
      }

      questions = questions.map((q, index) => ({
        question: q.question || `Question ${index + 1}`,
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : ["A", "B", "C", "D"],
        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: q.explanation || "No explanation provided",
        difficulty: q.difficulty || adjustedDifficulty
      }));

    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Content was:", content);
      throw new Error("Failed to parse question data");
    }

    console.log("Successfully generated", questions.length, "questions");

    return new Response(
      JSON.stringify({
        questions,
        adjustedDifficulty,
        performanceAnalysis: {
          accuracy: accuracy * 100,
          difficultyChange: adjustedDifficulty - difficulty
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-questions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
