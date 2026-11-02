"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/src/lib/api";
import type { ImportResponse, ImportRow } from "@/src/lib/studentImport";
import { unstable_rethrow } from "next/navigation";
import type { UpdateStudentInput } from "./EditStudentModal";

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

export async function importStudents(
  classroomId: string,
  rows: ImportRow[],
  commit: boolean,
): Promise<{ ok: true; data: ImportResponse } | { ok: false; error: string }> {
  try {
    const data = await api<ImportResponse>("/students/import", {
      method: "POST",
      body: JSON.stringify({ classroomId, rows, commit }),
    });
    if (commit) {
      revalidatePath("/students");
      revalidatePath("/classrooms");
    }
    return { ok: true, data };
  } catch (e) {
    unstable_rethrow(e); // ให้ redirect ไป /login ทำงานเมื่อ token หมดอายุ
    return { ok: false, error: (e as Error).message };
  }


}

export async function updateStudent(
  id: string,
  input: UpdateStudentInput
) {
  try {
    return await run(() =>
      api(`/students/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      })
    );
  } catch (e) {
    unstable_rethrow(e);

    return {
      ok: false,
      error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
    };
  }
}