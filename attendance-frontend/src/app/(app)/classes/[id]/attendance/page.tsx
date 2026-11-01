
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { api } from "@/src/lib/api";
import AttendanceForm from "./AttendanceForm";


type Data = {
  date: string;
  checked: boolean;
  students: {
    studentId: string;
    number: number | null;
    firstName: string;
    lastName: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | null;
  }[];
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
};

// วันที่ปัจจุบันตามเวลาไทย
function todayTH() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

// ตรวจสอบรูปแบบวันที่
function normalizeDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return todayTH();
  }

  const parsed = new Date(`${value}T12:00:00+07:00`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    return todayTH();
  }

  return value;
}

// แปลงวันที่เป็นภาษาไทย
function formatThaiDate(date: string) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00+07:00`));
}

// =====================================================
// Attendance Content
// =====================================================

async function AttendanceContent({
  params,
  searchParams,
}: PageProps) {
  // อ่าน Runtime Data ภายใน Suspense
  const { id } = await params;
  const { date: dateParam } = await searchParams;

  await connection();

  const date = normalizeDate(dateParam);

  const data = await api<Data>(
    `/classrooms/${encodeURIComponent(id)}/attendance?date=${encodeURIComponent(date)}`
  );

  return (
    <div className="space-y-6">

      {/* DATE SELECTOR */}

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">

          {/* ATTENDANCE DATE */}
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0D5] text-[#A76B17]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
                <path d="m9 16 2 2 4-4" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                Attendance Date
              </p>

              <h2 className="mt-1 text-base font-extrabold text-[var(--heading)] sm:text-lg">
                {formatThaiDate(date)}
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                เลือกวันที่ที่ต้องการเช็คชื่อ
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0">

            {/* DATE FORM */}
            <form
              method="GET"
              className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none"
            >
              <input
                type="date"
                name="date"
                aria-label="เลือกวันที่เช็คชื่อ"
                defaultValue={date}
                className="
            min-w-0 flex-1 rounded-xl
            border border-[var(--border)]
            bg-[#FFFCFA] px-3 py-3
            text-sm font-medium text-[var(--foreground)]
            outline-none transition-all
            focus:border-[#B42332]
            focus:ring-4 focus:ring-[#B42332]/10
            sm:w-44 sm:flex-none
          "
              />

              <button
                type="submit"
                className="
            inline-flex shrink-0 cursor-pointer
            items-center justify-center gap-2
            rounded-xl bg-[#B42332]
            px-4 py-3 text-sm font-bold text-white
            shadow-[0_5px_14px_rgba(180,35,50,0.18)]
            transition-all duration-200
            hover:-translate-y-0.5 hover:bg-[#921C2A]
            active:translate-y-0
          "
              >
                ดูข้อมูล
              </button>
            </form>

            {/* REPORT LINK */}
            <Link
              href={`/classes/${id}/reports`}
              className="
          inline-flex w-full shrink-0
          items-center justify-center gap-2
          rounded-xl border border-[var(--border)]
          bg-white px-5 py-3
          text-sm font-bold text-[var(--heading)]
          transition-all duration-200
          hover:border-[var(--primary)]
          hover:bg-[var(--surface-soft)]
          hover:text-[var(--primary)]
          sm:w-auto
        "
            >
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
                <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
                <path d="M16 3h5v5M10 14 21 3" />
                <path d="M7 8h5M7 12h3M7 16h5" />
              </svg>
              ดูรายงาน
            </Link>

          </div>
        </div>
      </section>


      {/* ATTENDANCE LIST */}

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">

        {/* Section Header */}

        <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-gradient-to-r from-[#FFF8F4] to-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F0] text-[#B42332]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="10" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <div>
              <h2 className="text-base font-extrabold text-[var(--heading)] sm:text-lg">
                รายชื่อนักเรียน
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                เลือกสถานะการเข้าเรียนของนักเรียนแต่ละคน
              </p>
            </div>
          </div>

          {/* บอกสถานะการบันทึกเท่านั้น ไม่ใช่สรุปสถิติ */}

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${data.checked
              ? "bg-[#EAF8F0] text-[#16845B]"
              : "bg-[#FFF0D5] text-[#9A5612]"
              }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${data.checked ? "bg-[#16845B]" : "bg-[#D69E36]"
                }`}
            />

            {data.checked ? "บันทึกเช็คชื่อแล้ว" : "ยังไม่ได้บันทึก"}
          </span>
        </div>

        {/* Attendance Form */}

        <div className="p-4 sm:p-6">
          {data.students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF5E8] text-[#B7791F]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="10" cy="7" r="4" />
                  <path d="M20 8v6M23 11h-6" />
                </svg>
              </div>

              <h3 className="mt-4 text-base font-bold text-[var(--heading)]">
                ยังไม่มีรายชื่อนักเรียน
              </h3>

              <p className="mt-2 text-sm text-[var(--muted)]">
                ไม่พบข้อมูลนักเรียนสำหรับการเช็คชื่อ
              </p>
            </div>
          ) : (
            <AttendanceForm
              key={`${id}-${date}`}
              classroomId={id}
              date={date}
              initial={data.students}
            />
          )}
        </div>
      </section>

      {/* FOOTER */}

      <p className="pb-4 text-center text-xs text-[var(--muted)]">
        กรุณาตรวจสอบสถานะนักเรียนให้ครบถ้วนก่อนกดบันทึก
      </p>
    </div>
  );
}

// =====================================================
// Loading Skeleton
// =====================================================

function AttendanceSkeleton() {
  return (
    <div
      role="status"
      aria-label="กำลังโหลดข้อมูลการเช็คชื่อ"
      className="animate-pulse space-y-6"
    >
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <div className="h-5 w-48 rounded-lg bg-[#F5E8E2]" />
        <div className="mt-4 h-4 w-64 max-w-full rounded-lg bg-[#FAF0EB]" />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <div className="h-6 w-48 rounded-lg bg-[#F5E8E2]" />

        <div className="mt-8 space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 rounded-xl bg-[#FAF5F1]"
            />
          ))}
        </div>
      </div>

      <span className="sr-only">กำลังโหลดข้อมูล...</span>
    </div>
  );
}

// =====================================================
// Page
// =====================================================

export default function AttendancePage(props: PageProps) {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">

        {/* BREADCRUMB */}

        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-sm"
        >
          <Link
            href="/classes"
            className="font-medium text-[var(--muted)] transition-colors hover:text-[#B42332]"
          >
            ห้องเรียน
          </Link>

          <span className="text-[#D9C9C4]">/</span>

          <span className="font-semibold text-[#B42332]">
            เช็คชื่อ
          </span>
        </nav>

        {/* PAGE HEADER */}

        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-white shadow-[0_6px_18px_rgba(180,35,50,0.2)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M8 2v4M16 2v4M3 10h18" />
              <path d="m8 15 2.5 2.5L16 12" />
            </svg>
          </div>

          <div>
            <span className="inline-block rounded-md bg-[#FFF0D5] px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#9A5612]">
              Attendance
            </span>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--heading)] sm:text-3xl">
              เช็คชื่อนักเรียน
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              จัดการและบันทึกการเข้าเรียนของนักเรียนประจำวัน
            </p>
          </div>
        </div>

        {/* Runtime Data อยู่ภายใน Suspense */}

        <Suspense fallback={<AttendanceSkeleton />}>
          <AttendanceContent
            params={props.params}
            searchParams={props.searchParams}
          />
        </Suspense>
      </div>
    </main>
  );
}
