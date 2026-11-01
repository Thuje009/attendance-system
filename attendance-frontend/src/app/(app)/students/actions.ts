"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/src/lib/api";

type Result = { ok: true } | { ok: false; error: string };

async function run(fn: () => Promise<unknown>): Promise<Result> {
  try {
    await fn();
    revalidatePath("/students");
    revalidatePath("/classrooms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function createStudent(input: {
  studentCode: string;
  firstName: string;
  lastName: string;
  classroomId?: string;
  number?: number;
}) {
  return run(() =>
    api("/students", { method: "POST", body: JSON.stringify(input) }),
  );
}

export async function setStudentActive(id: string, isActive: boolean) {
  return run(() =>
    api(`/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
  );
}