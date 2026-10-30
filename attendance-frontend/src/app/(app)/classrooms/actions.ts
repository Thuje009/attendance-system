"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/src/lib/api";

type Result = { ok: true } | { ok: false; error: string };

async function run(fn: () => Promise<unknown>): Promise<Result> {
  try {
    await fn();
    revalidatePath("/classrooms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function createClassroom(grade: number, room: number, academicYear: number) {
  return run(() =>
    api("/classrooms", {
      method: "POST",
      body: JSON.stringify({ grade, room, academicYear }),
    }),
  );
}

export async function assignTeacher(classroomId: string, userId: string) {
  return run(() =>
    api(`/classrooms/${classroomId}/teachers`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  );
}

export async function removeTeacher(classroomId: string, userId: string) {
  return run(() =>
    api(`/classrooms/${classroomId}/teachers/${userId}`, { method: "DELETE" }),
  );
}

export async function deleteClassroom(classroomId: string) {
  return run(() => api(`/classrooms/${classroomId}`, { method: "DELETE" }));
}