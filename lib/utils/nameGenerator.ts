const adjectives = [
  "Swift", "Neon", "Shadow", "Blazing", "Cyber", "Frost",
  "Storm", "Hyper", "Turbo", "Pixel", "Phantom", "Quantum",
  "Rapid", "Stealth", "Chrome", "Crimson", "Astral", "Volt",
  "Echo", "Prism", "Onyx", "Titan", "Omega", "Flux",
  "Nova", "Apex", "Zero", "Drift", "Pulse", "Viper",
]

const nouns = [
  "Fox", "Hawk", "Wolf", "Typer", "Racer", "Ghost",
  "Knight", "Runner", "Bolt", "Spark", "Rider", "Claw",
  "Flame", "Arrow", "Blade", "Dash", "Strike", "Raven",
  "Fury", "Comet", "Fang", "Storm", "Lynx", "Jet",
  "Surge", "Wraith", "Phoenix", "Byte", "Glitch", "Core",
]

export function generateFunName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}${noun}`
}

export function generateDiscriminator(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export function formatDisplayName(username: string, discriminator: string): string {
  return `${username}#${discriminator}`
}
