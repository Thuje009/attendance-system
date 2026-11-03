"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { api } from "@/src/lib/api";
import type {
  PromotionOptions,
  PromotionPreview,
  PromotionResult,
} from "@/src/lib/promotion";

type Result = { ok: true } | { ok: false; error: string };

async function run(fn: () => Promise<unknown>): Promise<Result> {
  try {
    await fn();
    revalidatePath("/classrooms");
    return { ok: true };
  } catch (e) {
    unstable_rethrow(e); // ให้ redirect ไป /login (token หมดอายุ) ทำงานได้
    return { ok: false, error: (e as Error).message };
  }
}

export async function createClassroom(
  level: "KINDERGARTEN" | "PRIMARY",
  grade: number,
  room: number,
  academicYear: number,
) {
  return run(() =>
    api("/classrooms", {
      method: "POST",
      body: JSON.stringify({ level, grade, room, academicYear }),
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

type Data<T> = { ok: true; data: T } | { ok: false; error: string };

export async function previewPromotion(
  input: PromotionOptions,
): Promise<Data<PromotionPreview>> {
  try {
    const data = await api<PromotionPreview>("/promotion/preview", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { ok: true, data };
  } catch (e) {
    unstable_rethrow(e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function applyPromotion(
  input: PromotionOptions,
): Promise<Data<PromotionResult>> {
  try {
    const data = await api<PromotionResult>("/promotion/apply", {
      method: "POST",
      body: JSON.stringify(input),
    });
    revalidatePath("/classrooms");
    revalidatePath("/students");
    revalidatePath("/classes");
    return { ok: true, data };
  } catch (e) {
    unstable_rethrow(e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function undoPromotion(year: number) {
  const res = await run(() => api(`/promotion/${year}`, { method: "DELETE" }));
  if (res.ok) {
    revalidatePath("/students");
    revalidatePath("/classes");
  }
  return res;
}