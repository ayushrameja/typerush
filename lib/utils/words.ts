const commonWords = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "is", "was", "are", "been", "has", "had", "did", "does", "may", "might",
  "must", "should", "very", "too", "more", "before", "between", "through", "under", "while",
  "where", "why", "again", "off", "always", "same", "another", "tell", "last", "never",
  "great", "little", "own", "old", "right", "big", "high", "long", "small", "large",
  "next", "early", "young", "important", "few", "public", "bad", "same", "able", "still",
  "world", "life", "hand", "part", "child", "place", "case", "week", "system", "each",
  "program", "question", "during", "point", "home", "down", "side", "being", "head", "house",
  "city", "area", "school", "story", "state", "book", "group", "often", "problem", "fact",
  "room", "word", "money", "thing", "study", "night", "water", "began", "idea", "light",
  "heard", "family", "interest", "development", "power", "court", "report", "door", "line", "face",
  "friend", "later", "open", "present", "learn", "meet", "change", "keep", "student", "become",
  "begin", "seem", "help", "turn", "start", "might", "show", "hear", "play", "run",
  "move", "live", "believe", "hold", "bring", "happen", "write", "sit", "stand", "lose",
  "pay", "read", "grow", "lead", "understand", "watch", "follow", "stop", "create", "speak",
  "allow", "add", "spend", "return", "remember", "stay", "fall", "leave", "reach", "kill",
  "remain", "suggest", "raise", "pass", "sell", "require", "decide", "pull", "receive", "send",
  "build", "involve", "produce", "include", "develop", "nothing", "continue", "try", "close", "feel",
  "late", "car", "hard", "left", "government", "company", "without", "against", "above", "country",
  "far", "different", "war", "heart", "since", "away", "three", "woman", "game", "end"
]

export function generateText(wordCount: number = 50): string {
  const words: string[] = []
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * commonWords.length)
    words.push(commonWords[randomIndex])
  }
  return words.join(" ")
}

export function generateTextForDuration(durationSeconds: number): string {
  const avgWPM = 50
  const wordsNeeded = Math.ceil((durationSeconds / 60) * avgWPM * 1.5)
  return generateText(wordsNeeded)
}
