export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

const beginnerWords = [
  "the", "a", "is", "it", "to", "in", "on", "at", "be", "as",
  "so", "we", "he", "by", "or", "do", "if", "my", "up", "an",
  "go", "no", "us", "am", "of", "me", "hi", "ok", "oh", "um",
  "and", "for", "are", "but", "not", "you", "all", "can", "had", "her",
  "was", "one", "our", "out", "day", "get", "has", "him", "his", "how",
  "its", "let", "may", "new", "now", "old", "see", "two", "way", "who",
  "boy", "did", "own", "say", "she", "too", "use", "run", "big", "top",
  "ask", "put", "set", "try", "why", "air", "end", "men", "add", "act"
]

const easyWords = [
  "about", "after", "again", "back", "been", "being", "both", "came",
  "come", "could", "down", "each", "even", "find", "first", "from",
  "give", "good", "great", "hand", "have", "here", "high", "home",
  "just", "know", "last", "left", "life", "like", "line", "little",
  "long", "look", "made", "make", "many", "more", "most", "much",
  "must", "name", "need", "never", "next", "only", "other", "over",
  "part", "place", "point", "right", "same", "show", "small", "some",
  "sound", "still", "such", "take", "tell", "than", "that", "them",
  "then", "there", "these", "they", "thing", "think", "this", "three",
  "time", "turn", "under", "upon", "very", "want", "water", "well",
  "went", "were", "what", "when", "where", "which", "while", "will",
  "with", "word", "work", "world", "would", "write", "year", "your"
]

const mediumWords = [
  "above", "across", "action", "actually", "against", "almost", "already",
  "always", "amount", "animal", "another", "answer", "appear", "around",
  "become", "before", "began", "behind", "believe", "below", "beside",
  "better", "between", "beyond", "brought", "building", "business",
  "called", "cannot", "carry", "center", "certain", "change", "children",
  "city", "class", "close", "common", "company", "complete", "contain",
  "continue", "control", "corner", "country", "course", "cover", "create",
  "current", "develop", "different", "direct", "during", "early", "earth",
  "effect", "either", "enough", "entire", "example", "experience", "explain",
  "family", "father", "figure", "follow", "force", "form", "forward",
  "found", "friend", "front", "further", "general", "given", "government",
  "ground", "group", "happen", "having", "heard", "heart", "heavy",
  "history", "house", "human", "hundred", "idea", "important", "include"
]

const hardWords = [
  "absolutely", "according", "acknowledge", "additional", "advantage",
  "advertisement", "afternoon", "agreement", "alternative", "altogether",
  "ambassador", "application", "appreciate", "appropriate", "arrangement",
  "association", "atmosphere", "attractive", "background", "beautiful",
  "behaviour", "breakfast", "brilliant", "calculate", "campaign",
  "capability", "carefully", "celebrate", "challenge", "championship",
  "character", "circumstance", "comfortable", "commission", "communicate",
  "community", "comparison", "competition", "complaint", "completely",
  "complicated", "concentrate", "conclusion", "condition", "conference",
  "confidence", "connection", "considerable", "construction", "contemporary",
  "contribution", "conversation", "corporation", "correspond", "criticism",
  "dangerous", "definitely", "demonstrate", "department", "description",
  "destination", "determination", "development", "difference", "difficult",
  "disappoint", "discipline", "discussion", "distinguish", "distribution",
  "documentary", "domestic", "economic", "education", "effective"
]

const expertWords = [
  "accomplishment", "acknowledgement", "administrative", "characteristic",
  "circumstances", "collaboration", "communication", "comprehensive",
  "concentration", "configuration", "consciousness", "consideration",
  "constitutional", "correspondence", "determination", "differentiation",
  "disappointment", "discrimination", "electromagnetic", "embarrassment",
  "encouragement", "entertainment", "environmental", "establishment",
  "extraordinary", "fundamentally", "implementation", "inappropriate",
  "independently", "infrastructure", "initialization", "instantaneous",
  "institutional", "instrumentation", "interdependent", "international",
  "interpretation", "investigation", "knowledgeable", "manufacturing",
  "mathematician", "mediterranean", "microprocessor", "miscellaneous",
  "misunderstanding", "notwithstanding", "organizational", "overwhelmingly",
  "pharmaceutical", "philosophical", "predominantly", "preferential",
  "professionalism", "pronunciation", "proportionate", "psychological",
  "questionnaire", "recommendation", "rehabilitation", "reinforcement",
  "representative", "responsibility", "revolutionary", "simultaneously",
  "sophistication", "specifications", "straightforward", "strengthening",
  "subconsciously", "substantially", "superintendent", "supplementary",
  "transformation", "transportation", "troubleshooting", "unbelievable",
  "uncomfortable", "understanding", "unfortunately", "unprecedented",
  "visualization", "vulnerability", "wholesomeness", "workmanship"
]

const wordPools: Record<Difficulty, string[]> = {
  beginner: beginnerWords,
  easy: easyWords,
  medium: mediumWords,
  hard: hardWords,
  expert: expertWords
}

export function generateText(wordCount: number = 50, difficulty: Difficulty = 'medium'): string {
  const pool = wordPools[difficulty]
  const words: string[] = []
  
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length)
    words.push(pool[randomIndex])
  }
  
  return words.join(" ")
}

export function generateTextForDuration(durationSeconds: number, difficulty: Difficulty = 'medium'): string {
  const avgWPM = difficulty === 'beginner' ? 30 : 
                 difficulty === 'easy' ? 40 : 
                 difficulty === 'medium' ? 50 : 
                 difficulty === 'hard' ? 45 : 35
  
  const wordsNeeded = Math.ceil((durationSeconds / 60) * avgWPM * 1.8)
  return generateText(wordsNeeded, difficulty)
}

export function getDifficultyDescription(difficulty: Difficulty): string {
  const descriptions: Record<Difficulty, string> = {
    beginner: "Simple 2-4 letter words for warming up",
    easy: "Common words you use every day",
    medium: "Regular vocabulary with moderate length",
    hard: "Complex words that challenge your skills",
    expert: "Technical and uncommon long words"
  }
  return descriptions[difficulty]
}
