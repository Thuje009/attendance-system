"use client";

import Link from "next/link";

type StudentStat = {
  studentId: string;
  number: number | null;
  studentCode: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  present: number;
  absent: number;
  late: number;
  leave: number;
  recorded: number;
  rate: number | null;
};

type DayStat = {
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
};

export type Report = {
  classroom: { grade: number; room: number; academicYear: number };
  range: { from: string; to: string };
  totals: { days: number; present: number; absent: number; late: number; leave: number };
  students: StudentStat[];
  days: DayStat[];
};

const inputCls =
  "rounded-xl border border-[var(--border)] bg-[#fffcfa] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[#b42332]/10";

const cardCls =
  "rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)]";

function thaiDate(d: string, withWeekday = false) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "UTC",
    weekday: withWeekday ? "short" : undefined,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${d}T00:00:00Z`));
}

// ≥90 เขียว, 80-89.9 เหลือง, <80 แดง
function rateBadge(rate: number | null) {
  if (rate === null) return "bg-gray-100 text-gray-500";
  if (rate >= 90) return "bg-emerald-50 text-emerald-700";
  if (rate >= 80) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

// กัน CSV formula injection และ escape เครื่องหมายคำพูด
function csvCell(v: string | number | null) {
  let s = v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function exportCsv(report: Report) {
  const header = [
    "เลขที่", "รหัสประจำตัว", "ชื่อ", "นามสกุล",
    "มา", "สาย", "ขาด", "ลา", "จำนวนครั้งที่บันทึก", "% มาเรียน",
  ];
  const rows = report.students.map((s) => [
    s.number, s.studentCode, s.firstName, s.lastName,
    s.present, s.late, s.absent, s.leave, s.recorded, s.rate,
  ]);

  // BOM ทำให้ Excel อ่านภาษาไทยถูกต้อง
  const csv =
    "\uFEFF" +
    [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance_${report.range.from}_${report.range.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className={`${cardCls} p-4`}>
      <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight ${tone}`}>{value}</p>
    </div>
  );
}

export default function ReportView({
  report,
  presets,
}: {
  report: Report;
  presets: { label: string; href: string }[];
}) {
  const { classroom, range, totals, students, days } = report;
  const recorded = totals.present + totals.absent + totals.late + totals.leave;
  const overall =
    recorded > 0
      ? (((totals.present + totals.late) / recorded) * 100).toFixed(1)
      : "-";

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-md bg-[#FFF0D5] px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#9A5612]">
            Attendance Report
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--heading)] sm:text-3xl">
            รายงานการเข้าเรียน ป.{classroom.grade}/{classroom.room}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            ปีการศึกษา {classroom.academicYear} · {thaiDate(range.from)} ถึง {thaiDate(range.to)}
          </p>
        </div>

        <div className="flex gap-2 print:hidden">
          <button
            type="button"
            onClick={() => exportCsv(report)}
            disabled={students.length === 0}
            className="cursor-pointer rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--heading)] transition-colors hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            ส่งออก CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="cursor-pointer rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2.5 text-sm font-bold !text-white shadow-[var(--shadow-button)] transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            พิมพ์
          </button>
        </div>
      </div>

      {/* FILTER */}
      <section className={`${cardCls} p-4 sm:p-5 print:hidden`}>
        <form method="GET" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-xs font-semibold text-[var(--muted)]">
            ตั้งแต่วันที่
            <input type="date" name="from" defaultValue={range.from} className={`${inputCls} mt-1 block w-full`} />
          </label>
          <label className="text-xs font-semibold text-[var(--muted)]">
            ถึงวันที่
            <input type="date" name="to" defaultValue={range.to} className={`${inputCls} mt-1 block w-full`} />
          </label>
          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-[#B42332] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#921C2A]"
          >
            ดูรายงาน
          </button>

          <div className="flex gap-2 sm:ml-auto">
            {presets.map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="rounded-xl border border-[var(--border)] px-3 py-2.5 text-xs font-semibold text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </form>
      </section>

      {totals.days === 0 ? (
        <div className={`${cardCls} border-dashed px-6 py-16 text-center`}>
          <h2 className="text-base font-bold text-[var(--heading)]">
            ไม่มีข้อมูลการเช็คชื่อในช่วงนี้
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            ลองเลือกช่วงวันที่อื่น หรือไปเช็คชื่อของวันที่ต้องการก่อน
          </p>
        </div>
      ) : (
        <>
          {/* SUMMARY */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <Stat label="วันที่เช็คชื่อ" value={totals.days} tone="text-[var(--heading)]" />
            <Stat label="มา" value={totals.present} tone="text-[#16845B]" />
            <Stat label="สาย" value={totals.late} tone="text-[#9A5612]" />
            <Stat label="ขาด" value={totals.absent} tone="text-[#C62828]" />
            <Stat label="ลา" value={totals.leave} tone="text-[#2F6FB5]" />
            <Stat label="มาเรียน (มา+สาย)" value={overall === "-" ? "-" : `${overall}%`} tone="text-[var(--primary)]" />
          </section>

          {/* PER STUDENT */}
          <section className={`${cardCls} overflow-hidden`}>
            <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <h2 className="text-lg font-extrabold text-[var(--heading)]">สรุปรายบุคคล</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                % มาเรียน = (มา + สาย) ÷ จำนวนครั้งที่มีบันทึก · สีแดงคือต่ำกว่า 80%
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[var(--surface-soft)] text-[11px] font-bold text-[var(--muted)]">
                    <th className="px-5 py-3">เลขที่</th>
                    <th className="px-5 py-3">ชื่อ - นามสกุล</th>
                    <th className="px-5 py-3 text-center">มา</th>
                    <th className="px-5 py-3 text-center">สาย</th>
                    <th className="px-5 py-3 text-center">ขาด</th>
                    <th className="px-5 py-3 text-center">ลา</th>
                    <th className="px-5 py-3 text-right">% มาเรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {students.map((s) => (
                    <tr key={s.studentId} className={s.isActive ? "" : "opacity-60"}>
                      <td className="px-5 py-3 text-[var(--muted)]">{s.number ?? "-"}</td>
                      <td className="px-5 py-3 font-semibold text-[var(--heading)]">
                        {s.firstName} {s.lastName}
                        {!s.isActive && (
                          <span className="ml-2 text-[10px] font-medium text-[var(--muted)]">(ปิดใช้งาน)</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">{s.present}</td>
                      <td className="px-5 py-3 text-center">{s.late}</td>
                      <td className={`px-5 py-3 text-center ${s.absent > 0 ? "font-bold text-[#C62828]" : ""}`}>
                        {s.absent}
                      </td>
                      <td className="px-5 py-3 text-center">{s.leave}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${rateBadge(s.rate)}`}>
                          {s.rate === null ? "-" : `${s.rate}%`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* PER DAY */}
          <section className={`${cardCls} overflow-hidden`}>
            <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <h2 className="text-lg font-extrabold text-[var(--heading)]">สรุปรายวัน</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[var(--surface-soft)] text-[11px] font-bold text-[var(--muted)]">
                    <th className="px-5 py-3">วันที่</th>
                    <th className="px-5 py-3 text-center">มา</th>
                    <th className="px-5 py-3 text-center">สาย</th>
                    <th className="px-5 py-3 text-center">ขาด</th>
                    <th className="px-5 py-3 text-center">ลา</th>
                    <th className="px-5 py-3 text-right">รวม (คน)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {days.map((d) => (
                    <tr key={d.date}>
                      <td className="px-5 py-3 font-medium text-[var(--heading)]">
                        {thaiDate(d.date, true)}
                      </td>
                      <td className="px-5 py-3 text-center">{d.present}</td>
                      <td className="px-5 py-3 text-center">{d.late}</td>
                      <td className={`px-5 py-3 text-center ${d.absent > 0 ? "font-bold text-[#C62828]" : ""}`}>
                        {d.absent}
                      </td>
                      <td className="px-5 py-3 text-center">{d.leave}</td>
                      <td className="px-5 py-3 text-right text-[var(--muted)]">{d.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}