export type EventFormat =
  | "Networking"
  | "Workshop"
  | "Talk"
  | "Demo day"
  | "Panel"
  | "Social"
  | "Coworking"
  | "Hackathon"
  | "Pitch"
  | "AMA"
  | "Game"
  | "Other";

const FORMAT_KEYWORDS: [EventFormat, string[]][] = [
  ["Hackathon", ["hackathon", "hack", "buildathon"]],
  ["Workshop", ["workshop", "building", "build session", "hands-on"]],
  ["Demo day", ["demo", "showcase", "show and tell"]],
  ["Panel", ["panel", "discussion", "roundtable"]],
  ["AMA", ["ama", "ask me anything"]],
  ["Pitch", ["pitch night", "pitch roulette", "pitch"]],
  ["Talk", ["talk", "fireside", "speaker"]],
  ["Coworking", ["coworking", "co-working", "cowork", "work session", "open office"]],
  ["Game", ["poker", "cards", "game night", "game", "board game", "arcade", "trivia"]],
  ["Social", ["social", "party", "celebration", "beer pong"]],
  [
    "Networking",
    ["networking", "mixer", "happy hour", "drinks", "founder friday"],
  ],
];

export function classifyFormat(title: string, description?: string): EventFormat {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  for (const [format, keywords] of FORMAT_KEYWORDS) {
    if (keywords.some((kw) => text.includes(kw))) {
      return format;
    }
  }

  return "Other";
}
