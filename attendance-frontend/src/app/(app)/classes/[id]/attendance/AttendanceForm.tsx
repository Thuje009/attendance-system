"use client";

import { useState, useTransition } from "react";
import { saveAttendance } from "./actions";

type Status = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

type Row = {
  studentId: string;
  number: number | null;
  firstName: string;
  lastName: string;
  status: Status | null;
};

const OPTIONS: {
  value: Status;
  label: string;
  active: string;
  idle: string;
}[] = [
  {
    value: "PRESENT",
    label: "มา",
    active: "border-[#16845B] bg-[#16845B] text-white",
    idle: "hover:border-[#16845B] hover:text-[#16845B]",
  },
  {
    value: "ABSENT",
    label: "ขาด",
    active: "border-[#C62828] bg-[#C62828] text-white",
    idle: "hover:border-[#C62828] hover:text-[#C62828]",
  },
  {
    value: "LATE",
    label: "สาย",
    active: "border-[#D69E36] bg-[#D69E36] text-white",
    idle: "hover:border-[#D69E36] hover:text-[#9A5612]",
  },
  {
    value: "LEAVE",
    label: "ลา",
    active: "border-[#2F6FB5] bg-[#2F6FB5] text-white",
    idle: "hover:border-[#2F6FB5] hover:text-[#2F6FB5]",
  },
];

const SUMMARY: { value: Status; label: string; color: string }[] = [
  { value: "PRESENT", label: "มา", color: "text-[#16845B]" },
  { value: "ABSENT", label: "ขาด", color: "text-[#C62828]" },
  { value: "LATE", label: "สาย", color: "text-[#9A5612]" },
  { value: "LEAVE", label: "ลา", color: "text-[#2F6FB5]" },
];

export default function AttendanceForm({
  classroomId,
  date,
  initial,
}: {
  classroomId: string;
  date: string;
  initial: Row[];
}) {
  const [rows, setRows] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const setStatus = (id: string, status: Status) => {
    setMsg(null);
    setRows((rs) =>
      rs.map((r) => (r.studentId === id ? { ...r, status } : r)),
    );
  };

  const allPresent = () => {
    setMsg(null);
    setRows((rs) => rs.map((r) => ({ ...r, status: "PRESENT" })));
  };

  const count = (s: Status) => rows.filter((r) => r.status === s).length;
  const unchecked = rows.filter((r) => !r.status).length;

  const save = () =>
    start(async () => {
      const records = rows
        .filter((r) => r.status)
        .map((r) => ({
          studentId: r.studentId,
          status: r.status as Status,
        }));

      const res = await saveAttendance(classroomId, date, records);
      setMsg(
        res.ok
          ? { ok: true, text: "บันทึกเรียบร้อยแล้ว" }
          : { ok: false, text: res.error },
      );
    });

  return (
    <div className="space-y-5">
      {/* สรุปสถานะ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SUMMARY.map((s) => (
          <div
            key={s.value}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
          >
            <p className="text-xs font-semibold text-[var(--muted)]">
              {s.label}
            </p>
            <p className={`mt-1 text-2xl font-extrabold ${s.color}`}>
              {count(s.value)}
            </p>
          </div>
        ))}
        <div className="col-span-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 sm:col-span-1">
          <p className="text-xs font-semibold text-[var(--muted)]">
            ยังไม่เช็ก
          </p>
          <p className="mt-1 text-2xl font-extrabold text-[var(--foreground)]">
            {unchecked}
          </p>
        </div>
      </div>

      {/* ปุ่มลัด */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={allPresent}
          className="cursor-pointer rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[#16845B] hover:text-[#16845B]"
        >
          ✓ มาทั้งหมด
        </button>
        <span className="text-xs text-[var(--muted)]">
          นักเรียนทั้งหมด {rows.length} คน
        </span>
      </div>

      {/* รายชื่อ */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        {rows.map((r) => (
          <div
            key={r.studentId}
            className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-3.5 transition-colors last:border-b-0 hover:bg-[var(--surface-hover)] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--badge-bg)] text-xs font-bold text-[var(--badge-text)]">
                {r.number ?? "-"}
              </span>
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {r.firstName} {r.lastName}
              </span>
            </div>

            <div
              className="grid grid-cols-4 gap-1.5 sm:flex"
              role="group"
              aria-label={`สถานะของ ${r.firstName} ${r.lastName}`}
            >
              {OPTIONS.map((o) => {
                const selected = r.status === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setStatus(r.studentId, o.value)}
                    className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-all sm:min-w-[56px] ${
                      selected
                        ? o.active
                        : `border-[var(--border)] bg-white text-[var(--muted)] ${o.idle}`
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* บันทึก */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending || unchecked === rows.length}
          className="cursor-pointer rounded-xl bg-[image:var(--gradient-primary)] px-7 py-3 text-sm font-bold !text-white shadow-[var(--shadow-button)] transition-all hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกการเช็คชื่อ"}
        </button>

        {unchecked > 0 && unchecked < rows.length && (
          <span className="text-xs text-[#9A5612]">
            ยังมีนักเรียน {unchecked} คนที่ไม่ได้เลือกสถานะ (จะไม่ถูกบันทึก)
          </span>
        )}

        {msg && (
          <span
            role="status"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              msg.ok
                ? "bg-[#EAF8F0] text-[#16845B]"
                : "bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}