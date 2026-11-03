import { Suspense } from "react";
import { connection } from "next/server";
import { api } from "@/src/lib/api";
import YearTabs from "@/src/components/YearTabs";
import ClassroomsManager, {
  type AdminClassroom,
  type TeacherOption,
} from "./ClassroomsManager";

type User = {
  id: string;
  fullName: string;
  role: "ADMIN" | "TEACHER";
  isActive: boolean;
};

async function Data() {
  await connection();

  try {
    const [classrooms, users] = await Promise.all([
      api<AdminClassroom[]>("/classrooms/all"),
      api<User[]>("/users"),
    ]);

    const teachers: TeacherOption[] = users
      .filter((u) => u.role === "TEACHER" && u.isActive)
      .map((u) => ({ id: u.id, fullName: u.fullName }));

    // ปีการศึกษา พ.ศ. ปัจจุบัน (ปีการศึกษาไทยเริ่มราวพฤษภาคม)
    const now = new Date();
    const defaultYear =
      now.getFullYear() + 543 - (now.getMonth() < 4 ? 1 : 0);

    return (
      <ClassroomsManager
        classrooms={classrooms}
        teachers={teachers}
        defaultYear={defaultYear}
      />
    );
  } catch (e) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        {(e as Error).message}
      </div>
    );
  }
}

export default function ClassroomsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 h-1.5 w-24 rounded-full bg-[image:var(--gradient-accent)]" />
        <Suspense fallback={<div className="animate-pulse rounded-2xl border border-[var(--border)] bg-white p-12 text-center text-sm text-[var(--muted)]">กำลังโหลด...</div>}>
          <Data />
        </Suspense>
      </div>
    </main>
  );
}