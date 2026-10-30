"use server";

import { api } from "@/src/lib/api";

type Status = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

export async function saveAttendance(
  classroomId: string,
  date: string,
  records: { studentId: string; status: Status; note?: string }[],
) {
  try {
    await api(`/classrooms/${classroomId}/attendance`, {
      method: "PUT",
      body: JSON.stringify({ date, records }),
    });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
