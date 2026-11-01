import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { api } from "@/src/lib/api";
import ReportView, { type Report } from "./ReportView";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

const pad = (n: number) => String(n).padStart(2, "0");

// วันที่ปัจจุบันตามเวลาไทย (YYYY-MM-DD)
function todayTH() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function isValidDate(v?: string): v is string {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  return new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
}

function monthRange(year: number, month: number) {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(last)}`,
  };
}

async function ReportContent({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  await connection(); // ต้องมาก่อนการอ่านเวลาปัจจุบัน

  const today = todayTH();
  const [y, m] = today.split("-").map(Number);

  let from = isValidDate(sp.from) ? sp.from : `${y}-${pad(m)}-01`;
  let to = isValidDate(sp.to) ? sp.to : today;
  if (from > to) [from, to] = [to, from];

  const prev = m === 1 ? monthRange(y - 1, 12) : monthRange(y, m - 1);
  const base = `/classes/${id}/reports`;
  const presets = [
    { label: "เดือนนี้", href: `${base}?from=${y}-${pad(m)}-01&to=${today}` },
    { label: "เดือนที่แล้ว", href: `${base}?from=${prev.from}&to=${prev.to}` },
  ];

  let report: Report;
  try {
    report = await api<Report>(
      `/classrooms/${encodeURIComponent(id)}/reports?from=${from}&to=${to}`,
    );
  } catch (e) {
    unstable_rethrow(e); // ให้ redirect ของ api() (กรณี 401) ทำงานต่อได้
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        โหลดรายงานไม่สำเร็จ
        <p className="mt-2 text-sm">{(e as Error).message}</p>
      </div>
    );
  }

  return <ReportView report={report} presets={presets} />;
}

function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="กำลังโหลดรายงาน">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[#F5E8E2]" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-[#FAF5F1]" />
    </div>
  );
}

export default function ReportPage(props: PageProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm print:hidden">
          <Link href="/classes" className="font-medium text-[var(--muted)] hover:text-[#B42332]">
            ชั้นเรียน
          </Link>
          <span className="text-[#D9C9C4]">/</span>
          <span className="font-semibold text-[#B42332]">รายงาน</span>
        </nav>

        <Suspense fallback={<ReportSkeleton />}>
          <ReportContent params={props.params} searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}