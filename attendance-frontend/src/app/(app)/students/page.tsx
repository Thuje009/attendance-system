
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { api } from "@/src/lib/api";
import { getCurrentUser } from "@/src/lib/auth/me";
import StudentsManager, {
  type ClassroomOption,
  type StudentRow,
} from "./StudentsManager";

async function Data() {
  const me = await getCurrentUser();

  if (me.role !== "ADMIN") {
    redirect("/classes");
  }

  try {
    const [students, classrooms] = await Promise.all([
      api<StudentRow[]>("/students"),
      api<ClassroomOption[]>("/classrooms/all"),
    ]);

    return (
      <StudentsManager
        students={students}
        classrooms={classrooms}
      />
    );
  } catch (e) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <p className="font-bold">โหลดข้อมูลไม่สำเร็จ</p>
        <p className="mt-2 text-sm">
          {(e as Error).message}
        </p>
      </div>
    );
  }
}

export default function StudentsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
      <div className="mx-auto max-w-7xl">

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f5dca7] bg-[var(--badge-bg)] px-3 py-1.5 text-[10px] font-extrabold tracking-[0.18em] text-[var(--badge-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b88628]" />
              STUDENT MANAGEMENT
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--heading)] sm:text-3xl">
              จัดการนักเรียน
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              จัดการข้อมูลนักเรียน เพิ่มรายชื่อ และกำหนดห้องเรียน
            </p>
          </div>

          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f1] text-[#b42332] sm:flex">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="10" cy="7" r="4" />
              <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-white"
                  />
                ))}
              </div>

              <div className="h-72 animate-pulse rounded-2xl border border-[var(--border)] bg-white" />
            </div>
          }
        >
          <Data />
        </Suspense>
      </div>
    </main>
  );
}
