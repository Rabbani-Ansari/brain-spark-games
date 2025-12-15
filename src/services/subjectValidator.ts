
// Off-topic keywords that should be rejected
const OFF_TOPIC_KEYWORDS = [
  // Movies/TV
  "movie", "movies", "film", "netflix", "disney", "marvel", "dc", "avengers",
  "stranger things", "squid game", "anime", "series", "episode", "season",
  "hollywood", "bollywood", "actor", "actress", "director",

  // Celebrities
  "celebrity", "celebrities", "virat", "kohli", "messi", "ronaldo", "shah rukh",
  "srk", "selena", "taylor swift", "bts", "blackpink", "influencer", "youtuber",
  "tiktoker", "instagram", "famous", "star",

  // Sports (non-academic)
  "cricket", "football", "soccer", "basketball", "ipl", "world cup", "match score",
  "live score", "tournament", "fifa", "nba", "nfl", "player stats", "team",
  "league", "premier league", "champions league",

  // Gaming
  "fortnite", "pubg", "minecraft", "valorant", "gta", "call of duty", "cod",
  "xbox", "playstation", "ps5", "nintendo", "gaming tips", "cheats", "walkthrough",
  "free fire", "roblox", "apex legends", "video game",

  // News/Trends
  "news", "trending", "viral", "meme", "memes", "gossip", "scandal", "politics",
  "election", "controversy", "rumor", "drama",

  // Food/Fashion (non-academic)
  "recipe", "cooking tips", "restaurant", "food review", "makeup", "fashion tips",
  "outfit", "style tips", "beauty tips", "skincare routine", "diet plan",

  // Music (non-academic)
  "song lyrics", "spotify", "concert", "music video", "album", "playlist",
  "latest song", "new release", "singer", "band",

  // Travel
  "travel tips", "hotel", "vacation", "tourist", "holiday destination",
  "flight booking", "best places to visit",

  // Social Media
  "followers", "likes", "viral video", "tiktok", "reels", "shorts",

  // Dating/Relationships (non-academic)
  "dating", "crush", "relationship advice", "breakup", "love life"
];

// General academic keywords that work across all subjects
const GENERAL_ACADEMIC_KEYWORDS = [
  // Learning verbs
  "study", "learn", "understand", "explain", "teach", "clarify", "describe",
  "define", "solve", "calculate", "prove", "derive", "analyze", "compare",

  // Question patterns
  "how do", "how does", "how to", "what is", "what are", "why do", "why does",
  "why is", "when do", "where do", "which", "can you explain", "help me",
  "i don't understand", "confused about", "stuck on",

  // Academic terms
  "homework", "assignment", "exam", "test", "quiz", "question", "problem",
  "exercise", "chapter", "lesson", "topic", "concept", "theory", "formula",
  "equation", "theorem", "principle", "law", "rule", "definition",

  // Academic actions
  "doubt", "doubts", "practice", "revision", "notes", "summary", "example",
  "examples", "steps", "method", "solution", "answer", "hint", "tip"
];

export const SUBJECT_KEYWORDS: Record<string, string[]> = {
  'Mathematics': [
    'math', 'fraction', 'algebra', 'geometry', 'trigonometry', 'calculus',
    'equation', 'polynomial', 'derivative', 'integral', 'matrix', 'vector',
    'number', 'digit', 'divide', 'multiply', 'add', 'subtract', 'percent',
    'probability', 'statistics', 'mean', 'median', 'mode', 'ratio', 'proportion',
    'angle', 'triangle', 'quadrilateral', 'circle', 'perimeter', 'area', 'volume',
    'root', 'exponent', 'power', 'equation', 'variable', 'constant', 'integer',
    'decimal', 'percentage', 'compound interest', 'profit', 'loss', 'discount',
    'hcf', 'lcm', 'pythagoras', 'congruence', 'construction', 'mensuration'
  ],

  'Science': [
    'science', 'physics', 'chemistry', 'biology', 'atom', 'molecule',
    'element', 'compound', 'reaction', 'force', 'energy', 'motion',
    'light', 'electricity', 'magnet', 'cell', 'organism', 'evolution',
    'photosynthesis', 'respiration', 'digestion', 'sound', 'heat', 'temperature',
    'pressure', 'density', 'gravity', 'friction', 'acceleration', 'velocity',
    'metal', 'nonmetal', 'acid', 'base', 'salt', 'oxide', 'oxide',
    'microorganism', 'bacteria', 'virus', 'disease', 'health', 'nutrition',
    'ecosystem', 'environment', 'pollution', 'climate', 'weather', 'water cycle',
    'fossil', 'mineral', 'rock', 'soil', 'atmosphere', 'reflection', 'refraction',
    'magnetic field', 'electric current', 'circuit', 'conductor', 'insulator',
    'skeleton', 'muscle', 'nerve', 'blood', 'heart', 'lung', 'brain'
  ],

  'English': [
    'english', 'grammar', 'literature', 'essay', 'poem', 'novel',
    'story', 'noun', 'verb', 'adjective', 'pronoun', 'tense',
    'comprehension', 'vocabulary', 'writing', 'reading', 'punctuation',
    'sentence', 'paragraph', 'dialogue', 'speech', 'article', 'preposition',
    'adjective', 'adverb', 'conjunction', 'present tense', 'past tense',
    'future tense', 'active voice', 'passive voice', 'subject', 'predicate',
    'rhyme', 'stanza', 'verse', 'prose', 'character', 'plot', 'theme'
  ],

  'Marathi': [
    'marathi', 'marathi essay', 'marathi grammar', 'marathi literature',
    'marathi poem', 'marathi story', 'marathi language', 'marathi writing',
    'marathi composition', 'marathi translation', 'marathi dictionary'
  ],

  'Hindi': [
    'hindi', 'hindi grammar', 'hindi essay', 'hindi literature',
    'hindi poem', 'hindi story', 'hindi language', 'hindi writing',
    'hindi composition', 'hindi translation', 'hindi vocabulary'
  ],

  'History': [
    'history', 'ancient', 'medieval', 'modern', 'empire', 'kingdom',
    'war', 'battle', 'ruler', 'king', 'emperor', 'dynasty',
    'civilization', 'era', 'period', 'monument', 'artifact', 'colonial',
    'independence', 'freedom struggle', 'mughal', 'british', 'british india',
    'independence movement', 'mahatma gandhi', 'constitution', 'parliament',
    'government', 'rights', 'duties', 'citizenship', '1857 revolt',
    'non-cooperation movement', 'civil disobedience', 'revolutionary'
  ],

  'Geography': [
    'geography', 'map', 'location', 'country', 'city', 'continent',
    'climate', 'weather', 'mountain', 'river', 'ocean', 'terrain',
    'population', 'culture', 'latitude', 'longitude', 'coordinates',
    'landform', 'plateau', 'valley', 'coast', 'desert', 'forest',
    'agriculture', 'industry', 'trade', 'settlement', 'natural resources',
    'ecosystem', 'environment', 'soil', 'rock', 'mineral', 'fossil',
    'weather systems', 'clouds', 'humidity', 'temperature', 'wind',
    'ocean current', 'tide', 'season', 'climate zone', 'biome'
  ],

  'Social Studies': [
    'history', 'geography', 'civics', 'government', 'constitution',
    'law', 'rights', 'duties', 'citizenship', 'parliament', 'democracy',
    'monarchy', 'republic', 'president', 'minister', 'parliament', 'lok sabha',
    'rajya sabha', 'election', 'voting', 'amendment', 'article', 'schedule'
  ],

  'Computer Science': [
    'computer', 'programming', 'python', 'java', 'code', 'algorithm',
    'data structure', 'database', 'network', 'software', 'hardware',
    'binary', 'logic', 'function', 'variable', 'loop', 'array',
    'coding', 'debug', 'compiler', 'system', 'application', 'internet',
    'web', 'server', 'client', 'protocol', 'security', 'password'
  ],

  'Physical Education': [
    'physical education', 'sports', 'exercise', 'fitness', 'yoga',
    'health', 'nutrition', 'diet', 'skill', 'agility', 'strength',
    'game', 'athletics', 'stretching', 'running', 'jumping',
    'flexibility', 'endurance', 'coordination'
  ],

  'Art Education': [
    'art', 'drawing', 'painting', 'sculpture', 'craft', 'design',
    'color', 'sketch', 'canvas', 'brushwork', 'perspective', 'shading',
    'composition', 'medium', 'technique', 'visual', 'creative', 'expression'
  ]
};

// Aliases for easier matching
const SUBJECT_ALIASES: Record<string, string> = {
  'History and Civics': 'History', // Map compound subjects to keys
  'Environmental Studies - Part I': 'Science', // Rough mapping
  'Environmental Studies - Part II': 'History', // Rough mapping
};

export const ALLOWED_TOPICS: Record<string, Record<number, string[]>> = {
  'Maharashtra State Board': {
    1: ['English', 'Marathi', 'Mathematics', 'Art Education', 'Physical Education', 'Work Experience'],
    2: ['English', 'Marathi', 'Mathematics', 'Art Education', 'Physical Education', 'Work Experience'],
    3: ['English', 'Marathi', 'Hindi', 'Mathematics', 'Environmental Studies - Part I', 'Environmental Studies - Part II', 'Art Education', 'Physical Education', 'Work Experience'],
    4: ['English', 'Marathi', 'Hindi', 'Mathematics', 'Environmental Studies - Part I', 'Environmental Studies - Part II', 'Art Education', 'Physical Education', 'Work Experience'],
    5: ['English', 'Marathi', 'Hindi', 'Mathematics', 'Environmental Studies - Part I', 'Environmental Studies - Part II', 'Art Education', 'Physical Education', 'Work Experience'],
    6: ['English', 'Marathi', 'Hindi', 'Mathematics', 'Science', 'History and Civics', 'Geography', 'Art Education', 'Physical Education'],
    7: ['English', 'Marathi', 'Hindi', 'Mathematics', 'Science', 'History and Civics', 'Geography', 'Art Education', 'Physical Education'],
    8: ['English', 'Marathi', 'Hindi', 'Mathematics', 'Science', 'History and Civics', 'Geography', 'Art Education', 'Physical Education', 'Sanskrit'],
  }
};

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  rejectionMessage?: string;
}

interface ValidationContext {
  grade?: string;
  board?: string;
  subject?: string;
}

/**
 * Validates if a question is academic/curriculum-related
 * Returns validation result with rejection message if invalid
 */
export function validateQuestion(question: string, context?: ValidationContext): ValidationResult {
  const lowerQuestion = question.toLowerCase().trim();

  // Empty or too short
  if (lowerQuestion.length < 3) {
    return {
      isValid: false,
      reason: "too_short",
      rejectionMessage: "Please type a complete question so I can help you better! 📝"
    };
  }

  // 1. Check for off-topic keywords (Hard Rejection)
  const offTopicMatch = OFF_TOPIC_KEYWORDS.find(keyword =>
    lowerQuestion.includes(keyword)
  );

  if (offTopicMatch) {
    // Exception: If the question strongly resembles an allowed subject query, might want to allow
    // But for safety, we reject "movies", "games" etc.
    // Unless it contains a very strong academic keyword
    const hasStrongAcademicIntent = GENERAL_ACADEMIC_KEYWORDS.some(k => lowerQuestion.includes(k));

    if (!hasStrongAcademicIntent) {
      return {
        isValid: false,
        reason: "off_topic",
        rejectionMessage: getOffTopicMessage(offTopicMatch)
      };
    }
  }

  // 2. Build Allowed Keywords List based on Context
  let allowedKeywords: string[] = [...GENERAL_ACADEMIC_KEYWORDS];

  if (context?.board && context?.grade) {
    const numericGrade = parseInt(context.grade);
    const boardConfig = ALLOWED_TOPICS[context.board]; // Exact match 'Maharashtra State Board'

    if (boardConfig && boardConfig[numericGrade]) {
      const allowedSubjects = boardConfig[numericGrade];

      allowedSubjects.forEach(sub => {
        // Direct match
        if (SUBJECT_KEYWORDS[sub]) {
          allowedKeywords = [...allowedKeywords, ...SUBJECT_KEYWORDS[sub]];
        }
        // Alias match
        else if (SUBJECT_ALIASES[sub] && SUBJECT_KEYWORDS[SUBJECT_ALIASES[sub]]) {
          allowedKeywords = [...allowedKeywords, ...SUBJECT_KEYWORDS[SUBJECT_ALIASES[sub]]];
        }
        // Keyword in subject name (e.g. "Environmental Studies")
        else {
          allowedKeywords.push(sub.toLowerCase());
        }
      });
    }
  } else {
    // Logic for fallback/no context or unknown board -> Allow all known subject keywords
    Object.values(SUBJECT_KEYWORDS).forEach(list => {
      allowedKeywords = [...allowedKeywords, ...list];
    });
  }

  // 3. Validation Logic
  const hasAllowedKeyword = allowedKeywords.some(keyword =>
    lowerQuestion.includes(keyword.toLowerCase())
  );

  if (hasAllowedKeyword) {
    return { isValid: true };
  }

  // 4. Fallback: If no specific keywords found, but no off-topic words either?
  // We might be too strict if we reject.
  // Let's rely on the "off-topic" filter primarily. 
  // If it didn't trigger off-topic, and user is asking something obscure but not forbidden, allow it.

  return { isValid: true };
}

/**
 * Generates a friendly rejection message based on the off-topic category
 */
function getOffTopicMessage(keyword: string): string {
  const categories: Record<string, string> = {
    // Movies/TV
    movie: "movies and entertainment",
    netflix: "streaming shows",
    marvel: "superhero movies",
    anime: "anime and cartoons",

    // Sports
    cricket: "sports",
    football: "sports",
    ipl: "sports tournaments",

    // Gaming
    fortnite: "video games",
    pubg: "video games",
    minecraft: "video games",

    // Social
    tiktok: "social media",
  };

  const category = categories[keyword] || "non-academic topics";

  return `📚 **Oops! That's Outside My Tutor Lane!**

I'm your **study buddy**, here to help with:
✅ Math problems & formulas
✅ Science concepts & experiments  
✅ Language & grammar doubts
✅ History, Geography & more!

I can't help with ${category}, but I'd **love** to help with your studies! 

What would you like to learn today? 🎓`;
}

/**
 * Quick check if message is likely a greeting or short casual message
 */
export function isGreeting(message: string): boolean {
  const greetings = ["hi", "hello", "hey", "hii", "hiii", "yo", "sup", "hola", "good morning"];
  const lower = message.toLowerCase().trim();
  return greetings.includes(lower) || lower.length <= 2;
}
