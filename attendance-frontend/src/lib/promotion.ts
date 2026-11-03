import type { Level } from "./classroom";

export type PromotionOptions = {
  fromYear: number;
  toYear: number;
  copyTeachers?: boolean;
  graduate?: boolean;
  excludeStudentIds?: string[];
};

export type PlanStudent = {
  studentId: string;
  studentCode: string;
  name: string;
  number: number | null;
  newNumber: number | null;
  status: "move" | "already" | "excluded";
};

export type PlanGroup = {
  source: { id: string; level: Level; grade: number; room: number };
  target: { level: Level; grade: number; room: number; exists: boolean } | null;
  teachers: { id: string; fullName: string }[];
  students: PlanStudent[];
  numberCleared: number;
};

export type PromotionPreview = {
  fromYear: number;
  toYear: number;
  groups: PlanGroup[];
  totals: {
    classesToCreate: number;
    move: number;
    graduate: number;
    already: number;
    excluded: number;
  };
};

export type PromotionResult = PromotionPreview["totals"] & {
  toYear: number;
  graduated: number;
};