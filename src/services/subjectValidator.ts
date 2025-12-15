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

// Academic keywords that indicate educational intent
const ACADEMIC_KEYWORDS = [
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
  
  // Subjects
  "math", "maths", "mathematics", "algebra", "geometry", "calculus", "trigonometry",
  "arithmetic", "statistics", "probability",
  "science", "physics", "chemistry", "biology", "botany", "zoology",
  "english", "grammar", "vocabulary", "essay", "writing", "literature",
  "history", "geography", "civics", "economics", "social studies",
  "hindi", "sanskrit",
  
  // Academic actions
  "doubt", "doubts", "practice", "revision", "notes", "summary", "example",
  "examples", "steps", "method", "solution", "answer", "hint", "tip"
];

// Subject-specific terms that are always academic
const SUBJECT_TERMS = [
  // Math
  "fraction", "decimal", "percentage", "ratio", "proportion", "integer",
  "polynomial", "quadratic", "linear", "graph", "coordinate", "matrix",
  "vector", "derivative", "integral", "limit", "function", "variable",
  "exponent", "logarithm", "root", "square", "cube", "prime", "factor",
  
  // Science
  "atom", "molecule", "element", "compound", "reaction", "energy", "force",
  "motion", "velocity", "acceleration", "gravity", "electricity", "magnetism",
  "wave", "light", "sound", "heat", "temperature", "pressure", "volume",
  "cell", "organism", "photosynthesis", "respiration", "digestion", "circulation",
  "ecosystem", "habitat", "species", "evolution", "genetics", "dna", "chromosome",
  
  // Language
  "noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction",
  "tense", "sentence", "paragraph", "punctuation", "spelling", "synonym", "antonym"
];

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  rejectionMessage?: string;
}

/**
 * Validates if a question is academic/curriculum-related
 * Returns validation result with rejection message if invalid
 */
export function validateQuestion(question: string): ValidationResult {
  const lowerQuestion = question.toLowerCase().trim();
  
  // Empty or too short
  if (lowerQuestion.length < 3) {
    return {
      isValid: false,
      reason: "too_short",
      rejectionMessage: "Please type a complete question so I can help you better! 📝"
    };
  }
  
  // Check for subject-specific terms first (always valid)
  for (const term of SUBJECT_TERMS) {
    if (lowerQuestion.includes(term)) {
      return { isValid: true };
    }
  }
  
  // Check for academic keywords
  const hasAcademicKeyword = ACADEMIC_KEYWORDS.some(keyword => 
    lowerQuestion.includes(keyword)
  );
  
  // Check for off-topic keywords
  const offTopicMatch = OFF_TOPIC_KEYWORDS.find(keyword =>
    lowerQuestion.includes(keyword)
  );
  
  // If has academic keyword, likely valid even with some off-topic words
  // (e.g., "explain the physics of football" should be valid)
  if (hasAcademicKeyword && !offTopicMatch) {
    return { isValid: true };
  }
  
  // If off-topic keyword found and no strong academic intent
  if (offTopicMatch && !hasAcademicKeyword) {
    return {
      isValid: false,
      reason: "off_topic",
      rejectionMessage: getOffTopicMessage(offTopicMatch)
    };
  }
  
  // If has both academic and off-topic, check if it's educational
  if (hasAcademicKeyword && offTopicMatch) {
    // Academic intent overrides - allow it
    return { isValid: true };
  }
  
  // No keywords found - allow it (might be a valid academic question)
  // Better to be permissive than block legitimate questions
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
    bollywood: "entertainment",
    hollywood: "entertainment",
    
    // Celebrities
    celebrity: "celebrities",
    virat: "sports celebrities",
    messi: "sports celebrities",
    ronaldo: "sports celebrities",
    
    // Sports
    cricket: "sports",
    football: "sports",
    ipl: "sports tournaments",
    
    // Gaming
    fortnite: "video games",
    pubg: "video games",
    minecraft: "video games",
    
    // Social
    trending: "trending topics",
    viral: "viral content",
    meme: "memes",
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

💡 **Try asking:**
• "Explain fractions with examples"
• "What is photosynthesis?"
• "Help me with grammar rules"

What would you like to learn today? 🎓`;
}

/**
 * Quick check if message is likely a greeting or short casual message
 */
export function isGreeting(message: string): boolean {
  const greetings = ["hi", "hello", "hey", "hii", "hiii", "yo", "sup", "hola"];
  const lower = message.toLowerCase().trim();
  return greetings.includes(lower) || lower.length <= 2;
}
