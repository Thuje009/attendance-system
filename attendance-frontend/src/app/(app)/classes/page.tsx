
import Link from "next/link";
import { Suspense } from "react";
import { api } from "@/src/lib/api";
import { Level } from "@/src/lib/classroom";
import YearTabs from "@/src/components/YearTabs";

type Classroom = {
  id: string;
  level: Level;
  grade: number;
  room: number;
  academicYear: number;
  _count: { enrollments: number };
};


function ClassListSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-[var(--border)] bg-white p-5"
        >
          <div className="mb-5 h-12 w-12 rounded-2xl bg-[#f8e8e5]" />
          <div className="mb-3 h-5 w-28 rounded bg-[#f8e8e5]" />
          <div className="h-4 w-36 rounded bg-[#f7eee9]" />
          <div className="mt-7 h-16 rounded-xl bg-[#fff8f2]" />
        </div>
      ))}
    </div>
  );
}

async function ClassList({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const all = await api<Classroom[]>("/classrooms/mine");
  const { year } = await searchParams;

  const years = [...new Set(all.map((c) => c.academicYear))].sort(
    (a, b) => b - a,
  );
  const selected = years.includes(Number(year)) ? Number(year) : years[0];
  const classes = all.filter((c) => c.academicYear === selected);

  if (all.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-dashed border-[var(--border)] bg-white px-6 py-14 text-center shadow-[0_8px_32px_rgba(130,28,41,0.035)] sm:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#fff1e9] text-[#b42332]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
          </svg>
        </div>
        <h2 className="mt-5 text-lg font-bold text-[var(--heading)]">
          ยังไม่มีชั้นเรียน
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
          ขณะนี้คุณยังไม่ได้รับมอบหมายชั้นเรียน
          หากคิดว่าเกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ
        </p>
      </div>
    );
  }

  return (
    <>
      <YearTabs years={years} selected={selected} basePath="/classes" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          เลือกชั้นเรียนเพื่อเข้าสู่ระบบเช็กชื่อ
        </p>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#f1dfc3] bg-[#fff8e9] px-3 py-1.5 text-xs font-semibold text-[#8a6420]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d5a12a]" />
          {classes.length} ห้องเรียน
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/classes/${c.id}/attendance`}
            className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_4px_18px_rgba(130,28,41,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#e9b8b9] hover:shadow-[0_14px_35px_rgba(130,28,41,0.10)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#b42332]/15"
          >
            <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-[#fff2e9] transition-transform duration-300 group-hover:scale-125" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-white shadow-[0_5px_14px_rgba(180,35,50,0.18)] transition-transform duration-300 group-hover:scale-105">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
                </svg>
              </div>

              <span className="rounded-full border border-[#f0dfc9] bg-[#fff9ed] px-2.5 py-1 text-[11px] font-semibold text-[#8a6420]">
                ปี {c.academicYear}
              </span>
            </div>


            <div className="relative mt-5">
              <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">
                ชั้นเรียนที่รับผิดชอบ
              </p>

              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--heading)]">
                {c.level === "KINDERGARTEN" ? "อ." : "ป."}
                {c.grade}
                <span className="mx-1 text-[#d8b8b5]">/</span>
                {c.room}
              </h2>
            </div>


            <div className="relative mt-5 flex items-center justify-between rounded-xl bg-[#fff8f4] px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#b42332] shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="10" cy="7" r="4" />
                    <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs text-[var(--muted)]">นักเรียน</p>
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    {c._count.enrollments} คน
                  </p>
                </div>
              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--primary)] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[var(--primary)] group-hover:text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>

            <p className="relative mt-4 text-xs font-semibold text-[var(--primary)] opacity-80 transition-opacity group-hover:opacity-100">
              เข้าสู่หน้าเช็กชื่อ →
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  return (
    <main className="min-h-[calc(100vh-76px)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-[image:var(--gradient-primary)] px-6 py-8 shadow-[0_12px_32px_rgba(130,28,41,0.16)] sm:px-9 sm:py-9">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -right-2 -top-8 h-40 w-40 rounded-full border border-white/10" />
          <div className="absolute bottom-0 right-24 h-24 w-24 translate-y-1/2 rounded-full bg-[#f4b942]/15 blur-sm" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f4c75e]" />
                ระบบจัดการชั้นเรียน
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                ชั้นเรียนของฉัน
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/75 sm:text-base">
                จัดการการเข้าเรียนและตรวจสอบรายชื่อนักเรียน
                ในชั้นเรียนที่คุณรับผิดชอบ
              </p>
            </div>

            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-[#f4c75e] backdrop-blur-sm sm:flex">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-11 w-11"
                aria-hidden="true"
              >
                <path d="M2 8.5 12 3l10 5.5-10 5.5L2 8.5Z" />
                <path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5M22 8.5V15" />
              </svg>
            </div>
          </div>
        </div>

        <section aria-label="รายการชั้นเรียน">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[var(--heading)]">
              รายการชั้นเรียน
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              ห้องเรียนที่ได้รับมอบหมายให้ดูแล
            </p>
          </div>

          <Suspense fallback={<ClassListSkeleton />}>
            <ClassList searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
