export type Level = "KINDERGARTEN" | "PRIMARY";

export const LEVEL_SHORT: Record<Level, string> = {
  KINDERGARTEN: "อ.",
  PRIMARY: "ป.",
};

export const LEVEL_LONG: Record<Level, string> = {
  KINDERGARTEN: "อนุบาล",
  PRIMARY: "ประถมศึกษาปีที่",
};

export const gradeLimit = (level: Level) => (level === "KINDERGARTEN" ? 3 : 6);

// เช่น "อ.1/1", "ป.3/2"
export function classLabel(c: { level: Level; grade: number; room: number }) {
  return `${LEVEL_SHORT[c.level]}${c.grade}/${c.room}`;
}