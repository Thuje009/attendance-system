
"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import {
  assignTeacher,
  createClassroom,
  deleteClassroom,
  removeTeacher,
} from "./actions";
import { gradeLimit, LEVEL_LONG, type Level } from "@/src/lib/classroom";

export type AdminClassroom = {
  id: string;
  grade: number;
  level: Level;
  room: number;
  academicYear: number;
  _count: { enrollments: number };
  teachers: { user: { id: string; fullName: string } }[];
};

export type TeacherOption = {
  id: string;
  fullName: string;
};

const inputCls = `
  w-full rounded-xl border border-[var(--border)]
  bg-[#fffcfa] px-4 py-3 text-sm text-[var(--heading)]
  outline-none transition-all duration-200
  focus:border-[var(--primary)]
  focus:ring-4 focus:ring-[#b42332]/10
  disabled:cursor-not-allowed disabled:opacity-50
`;

const cardCls = `
  rounded-2xl border border-[var(--border)]
  bg-white shadow-[var(--shadow-card)]
`;

function SchoolIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-7h6v7M9 10h.01M15 10h.01" />
    </svg>
  );
}

function getClassroomLabel(
  level: Level,
  grade: number,
  room: number,
) {
  const prefix = level === "KINDERGARTEN" ? "อ." : "ป.";
  return `${prefix}${grade}/${room}`;
}

function UsersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1" />
    </svg>
  );
}


function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  description: string;
}) {
  return (
    <div className={`${cardCls} p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[var(--muted)]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--heading)]">
            {value.toLocaleString("th-TH")}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0f1] text-[var(--primary)]">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}

export default function ClassroomsManager({
  classrooms,
  teachers,
  defaultYear,
}: {
  classrooms: AdminClassroom[];
  teachers: TeacherOption[];
  defaultYear: number;
}) {
  const [grade, setGrade] = useState(1);
  const [room, setRoom] = useState(1);
  const [year, setYear] = useState(defaultYear);

  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [pending, start] = useTransition();
  const [level, setLevel] = useState<Level>("PRIMARY");

  const totalStudents = classrooms.reduce(
    (sum, c) => sum + c._count.enrollments,
    0,
  );

  const assignedTeachers = new Set(
    classrooms.flatMap((c) =>
      c.teachers.map((t) => t.user.id),
    ),
  ).size;

  // เรียงอนุบาลก่อนประถม
  const sortedClassrooms = [...classrooms].sort((a, b) => {
    const levelOrder = {
      KINDERGARTEN: 0,
      PRIMARY: 1,
    };

    return (
      levelOrder[a.level] - levelOrder[b.level] ||
      a.grade - b.grade ||
      a.room - b.room ||
      b.academicYear - a.academicYear
    );
  });

  const handle = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    okText: string,
  ) => {
    setMsg(null);

    start(async () => {
      try {
        const res = await fn();

        setIsError(!res.ok);
        setMsg(
          res.ok
            ? okText
            : (res.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่"),
        );
      } catch {
        setIsError(true);
        setMsg("ไม่สามารถดำเนินการได้ กรุณาลองใหม่");
      }
    });
  };

  return (
    <div className="space-y-7 pb-10">

      {/* HEADER */}
      <header className="relative overflow-hidden rounded-3xl bg-[image:var(--gradient-primary)] p-6 text-white shadow-[var(--shadow-button)] sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full border border-white/15" />
        <div className="pointer-events-none absolute -right-3 -top-8 h-36 w-36 rounded-full border border-white/15" />
        <div className="pointer-events-none absolute bottom-[-70px] right-28 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Classroom Management
            </p>

            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              จัดการชั้นเรียน
            </h1>

            <p className="mt-2 text-sm text-white/80">
              สร้างห้องเรียนและจัดการครูประจำชั้นในที่เดียว
            </p>
          </div>

          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-sm sm:flex">
            <SchoolIcon className="h-9 w-9" />
          </div>
        </div>
      </header>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="ห้องเรียนทั้งหมด"
          value={classrooms.length}
          description="จำนวนห้องเรียนในรายการ"
          icon={<SchoolIcon className="h-6 w-6" />}
        />

        <StatCard
          label="นักเรียนในห้องเรียน"
          value={totalStudents}
          description="รวมจำนวนการลงทะเบียนในห้อง"
          icon={<UsersIcon className="h-6 w-6" />}
        />

        <StatCard
          label="ครูที่ได้รับมอบหมาย"
          value={assignedTeachers}
          description="นับจำนวนครูไม่ซ้ำกัน"
          icon={<UsersIcon className="h-6 w-6" />}
        />
      </div>


      {/* CREATE CLASSROOM */}
      <section className={`${cardCls} overflow-hidden`}>
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0f1] text-xl font-bold text-[var(--primary)]">
            +
          </div>

          <div>
            <h2 className="text-base font-bold text-[var(--heading)] sm:text-lg">
              สร้างชั้นเรียนใหม่
            </h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              ระบุระดับชั้น ห้อง และปีการศึกษา
            </p>
          </div>
        </div>

        <form
          className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();

            if (
              !Number.isInteger(grade) ||
              grade < 1 ||
              grade > gradeLimit(level) ||
              !Number.isInteger(room) ||
              room < 1 ||
              !Number.isInteger(year) ||
              year < 1
            ) {
              setIsError(true);
              setMsg("กรุณาตรวจสอบระดับชั้น เลขห้อง และปีการศึกษาให้ถูกต้อง");
              return;
            }

            handle(
              () => createClassroom(level, grade, room, year),
              "สร้างชั้นเรียนเรียบร้อยแล้ว",
            );
          }}
        >
          <label className="block space-y-2">
            <span className="text-xs font-bold text-[var(--heading)]">ระดับ</span>
            <select
              className={inputCls}
              value={level}
              disabled={pending}
              onChange={(e) => {
                setLevel(e.target.value as Level);
                setGrade(1);
              }}
            >
              <option value="KINDERGARTEN">อนุบาล</option>
              <option value="PRIMARY">ประถมศึกษา</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-[var(--heading)]">ชั้น</span>
            <select
              className={inputCls}
              value={grade}
              disabled={pending}
              onChange={(e) => setGrade(Number(e.target.value))}
            >
              {Array.from({ length: gradeLimit(level) }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  {LEVEL_LONG[level]} {g}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-[var(--heading)]">
              ห้อง
            </span>

            <input
              className={inputCls}
              type="number"
              min={1}
              step={1}
              required
              value={room}
              disabled={pending}
              onChange={(e) => setRoom(Number(e.target.value))}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-[var(--heading)]">
              ปีการศึกษา (พ.ศ.)
            </span>

            <input
              className={inputCls}
              type="number"
              min={1}
              step={1}
              required
              value={year}
              disabled={pending}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="
                flex w-full cursor-pointer items-center justify-center gap-2
                rounded-xl bg-[image:var(--gradient-primary)]
                px-5 py-3 text-sm font-bold !text-white
                shadow-[var(--shadow-button)]
                transition-all duration-200
                hover:-translate-y-0.5 hover:brightness-110
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <span className="text-lg leading-none">+</span>
                  สร้างชั้นเรียน
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* FEEDBACK */}
      {msg && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${isError
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
        >
          <span className="text-lg">
            {isError ? "!" : "✓"}
          </span>
          {msg}
        </div>
      )}

      {/* CLASSROOM LIST HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--heading)]">
            รายการชั้นเรียน
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            จัดการครูประจำชั้นและรายละเอียดห้องเรียน
          </p>
        </div>

        <span className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-bold text-[var(--heading)]">
          ทั้งหมด {classrooms.length} ห้อง
        </span>
      </div>

      {/* CLASSROOM CARDS */}
      {classrooms.length === 0 ? (
        <div className={`${cardCls} flex flex-col items-center justify-center px-6 py-16 text-center`}>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0f1] text-[var(--primary)]">
            <SchoolIcon className="h-9 w-9" />
          </div>

          <h3 className="text-lg font-bold text-[var(--heading)]">
            ยังไม่มีชั้นเรียน
          </h3>

          <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
            เริ่มต้นด้วยการสร้างชั้นเรียนใหม่จากแบบฟอร์มด้านบน
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {sortedClassrooms.map((c) => {
            const label = `${c.level === "KINDERGARTEN" ? "อ." : "ป."}${c.grade}/${c.room}`;

            const assigned = new Set(
              c.teachers.map((t) => t.user.id),
            );

            const available = teachers.filter(
              (t) => !assigned.has(t.id),
            );

            return (
              <article
                key={c.id}
                className={`
                  ${cardCls} group relative overflow-hidden
                  transition-all duration-200
                  hover:-translate-y-0.5 hover:shadow-lg
                `}
              >
                {/* Accent */}
                <div className="h-1 bg-[image:var(--gradient-primary)]" />

                <div className="p-5 sm:p-6">

                  {/* ROOM HEADER */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff0f1] text-[var(--primary)]">
                        <SchoolIcon className="h-7 w-7" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                          Classroom
                        </p>

                        <h3 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[var(--heading)]">
                          {label}
                        </h3>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/classes/${c.id}/reports`}
                        className="
                          inline-flex items-center gap-2 rounded-xl
                          border border-[var(--border)] bg-white
                          px-3 py-2 text-xs font-bold
                          text-[var(--heading)] transition-all
                          hover:border-[var(--primary)]
                          hover:bg-[#fff0f1]
                          hover:text-[var(--primary)]
                          sm:px-4 sm:text-sm
                        "
                      >
                        ดูรายงาน
                      </Link>
                      <button
                        type="button"
                        disabled={pending}
                        aria-label={`ลบชั้น ${label}`}
                        title="ลบชั้นเรียน"
                        onClick={() => {
                          if (
                            window.confirm(
                              `ต้องการลบชั้น ${label} ปี ${c.academicYear} หรือไม่?\n\nลบได้เฉพาะชั้นที่ไม่มีนักเรียนและไม่มีประวัติเช็คชื่อ`,
                            )
                          ) {
                            handle(
                              () => deleteClassroom(c.id),
                              "ลบชั้นเรียนเรียบร้อยแล้ว",
                            );
                          }
                        }}
                        className="
                          flex h-9 w-9 shrink-0 cursor-pointer
                          items-center justify-center rounded-xl
                          border border-[var(--border)]
                          text-[var(--muted)] transition-all
                          hover:border-red-200 hover:bg-red-50
                          hover:text-red-600
                          disabled:cursor-not-allowed disabled:opacity-50
                        "
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  {/* META */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--heading)]">
                      ปีการศึกษา {c.academicYear}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--badge-bg)] px-3 py-1.5 text-xs font-bold text-[var(--badge-text)]">
                      <UsersIcon className="h-3.5 w-3.5" />
                      {c._count.enrollments} นักเรียน
                    </span>
                  </div>

                  <div className="my-5 h-px bg-[var(--border)]" />

                  {/* TEACHERS */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-[var(--heading)]">
                      ครูประจำชั้น
                    </h4>

                    <span className="text-xs text-[var(--muted)]">
                      {c.teachers.length} คน
                    </span>
                  </div>

                  {c.teachers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-5 text-center">
                      <p className="text-sm text-[var(--muted)]">
                        ยังไม่ได้มอบหมายครูประจำชั้น
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {c.teachers.map((t) => (
                        <div
                          key={t.user.id}
                          className="
                            flex items-center justify-between gap-3
                            rounded-xl border border-[var(--border)]
                            bg-[#fffcfa] px-3 py-2.5
                          "
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fce7ea] text-sm font-extrabold text-[var(--primary)]">
                              {t.user.fullName.trim().charAt(0) || "ค"}
                            </div>

                            <span className="truncate text-sm font-semibold text-[var(--heading)]">
                              {t.user.fullName}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={pending}
                            aria-label={`เอา ${t.user.fullName} ออกจากชั้น`}
                            title="นำครูออกจากชั้นเรียน"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `ต้องการเอา ${t.user.fullName} ออกจาก ${label} หรือไม่?`,
                                )
                              ) {
                                handle(
                                  () => removeTeacher(c.id, t.user.id),
                                  "นำครูออกจากชั้นเรียนเรียบร้อยแล้ว",
                                );
                              }
                            }}
                            className="
                              flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center
                              rounded-lg text-lg text-[var(--muted)]
                              transition-colors hover:bg-red-50 hover:text-red-600
                              disabled:cursor-not-allowed disabled:opacity-50
                            "
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ASSIGN TEACHER */}
                  <div className="mt-4">
                    {available.length > 0 ? (
                      <select
                        aria-label={`มอบหมายครูให้ชั้น ${label}`}
                        className={inputCls}
                        value=""
                        disabled={pending}
                        onChange={(e) => {
                          const teacherId = e.target.value;

                          if (teacherId) {
                            handle(
                              () => assignTeacher(c.id, teacherId),
                              "มอบหมายครูเรียบร้อยแล้ว",
                            );
                          }
                        }}
                      >
                        <option value="">
                          + มอบหมายครูเข้าชั้นเรียน...
                        </option>

                        {available.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="rounded-xl bg-[var(--surface-soft)] px-3 py-3 text-center text-xs text-[var(--muted)]">
                        ไม่มีครูเพิ่มเติมให้มอบหมาย
                      </p>
                    )}
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
