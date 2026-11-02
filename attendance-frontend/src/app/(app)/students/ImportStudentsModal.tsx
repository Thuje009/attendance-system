"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { classLabel } from "@/src/lib/classroom";
import {
  parseStudentRows,
  parseStudentTable,
  sheetRowsToTable,
  type ImportResponse,
  type ParsedItem,
} from "@/src/lib/studentImport";
import { importStudents } from "./actions";
import type { ClassroomOption } from "./StudentsManager";

type Display = {
  line: number;
  studentCode: string;
  name: string;
  number: number | null;
  action: "create" | "update" | "error";
  errors: string[];
};

type SheetData = { name: string; table: string[][]; count: number };

const MAX_ROWS = 200;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-[#fffcfa] px-4 py-3 text-sm text-[var(--heading)] outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[#b42332]/10 disabled:cursor-not-allowed disabled:opacity-50";

const ACTION_STYLE = {
  create: { label: "สร้างใหม่", done: "สร้างแล้ว", cls: "bg-emerald-50 text-emerald-700" },
  update: { label: "อัปเดต", done: "อัปเดตแล้ว", cls: "bg-amber-50 text-amber-700" },
  error: { label: "ข้าม", done: "ข้าม", cls: "bg-red-50 text-red-700" },
} as const;

// รวมผลที่ตรวจฝั่งเบราว์เซอร์กับผลจากเซิร์ฟเวอร์ ให้เรียงตามต้นฉบับ
function merge(items: ParsedItem[], resp: ImportResponse | null): Display[] {
  let k = 0;
  return items.map((it) => {
    const base = {
      line: it.line,
      studentCode: it.row.studentCode,
      name: `${it.row.firstName} ${it.row.lastName}`.trim(),
      number: it.row.number ?? null,
    };
    if (it.clientErrors.length > 0 || !resp) {
      return { ...base, action: "error" as const, errors: it.clientErrors };
    }
    const r = resp.rows[k++];
    return {
      ...base,
      action: r?.action ?? ("error" as const),
      errors: r?.errors ?? ["ไม่ได้รับผลตรวจจากเซิร์ฟเวอร์"],
    };
  });
}

export default function ImportStudentsModal({
  open,
  classrooms,
  onClose,
  onImported,
}: {
  open: boolean;
  classrooms: ClassroomOption[];
  onClose: () => void;
  onImported: (summary: { create: number; update: number }) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [classroomId, setClassroomId] = useState("");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [reading, setReading] = useState(false);

  const [items, setItems] = useState<ParsedItem[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [display, setDisplay] = useState<Display[] | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const busy = pending || reading;
  const hasFile = sheets.length > 0;
  const currentSheet = hasFile ? sheets[sheetIndex] : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const clearFile = () => {
    setFileName(null);
    setSheets([]);
    setSheetIndex(0);
  };

  // ล้างข้อมูลดิบ (มีเลขบัตร/ที่อยู่) ออกจากหน่วยความจำทุกครั้งที่ปิด
  const reset = () => {
    setText("");
    clearFile();
    setItems([]);
    setSkipped(0);
    setDisplay(null);
    setDone(false);
    setError(null);
  };

  const closeModal = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // ให้เลือกไฟล์เดิมซ้ำได้
    if (!file) return;

    setError(null);

    if (!/\.xlsx$/i.test(file.name)) {
      setError(
        "รองรับเฉพาะไฟล์ .xlsx (ถ้าเป็น .xls ให้เปิดแล้วบันทึกเป็น .xlsx ก่อน)",
      );
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("ไฟล์ใหญ่เกินไป (สูงสุด 5 MB)");
      return;
    }

    setReading(true);
    try {
      const XLSX = await import("xlsx"); // โหลดเมื่อเลือกไฟล์เท่านั้น

      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });

      const loaded: SheetData[] = wb.SheetNames.map((name) => {
        const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
          header: 1,
          raw: true,
          defval: "",
          blankrows: false,
        });
        const table = sheetRowsToTable(rows);
        return { name, table, count: parseStudentTable(table).items.length };
      });

      if (loaded.length === 0) throw new Error("empty");

      const firstWithData = loaded.findIndex((s) => s.count > 0);
      setSheets(loaded);
      setSheetIndex(firstWithData >= 0 ? firstWithData : 0);
      setFileName(file.name);
      setText("");
    } catch {
      setError(
        "อ่านไฟล์ไม่ได้ ไฟล์อาจเสียหรือมีรหัสผ่าน ลองบันทึกเป็น .xlsx ใหม่อีกครั้ง",
      );
    } finally {
      setReading(false);
    }
  };

  const sendable = () =>
    items.filter((i) => i.clientErrors.length === 0).map((i) => i.row);

  const check = () => {
    setError(null);

    if (!classroomId) {
      setError("กรุณาเลือกชั้นเรียนปลายทาง");
      return;
    }

    const parsed = currentSheet
      ? parseStudentTable(currentSheet.table)
      : parseStudentRows(text);

    if (parsed.items.length === 0) {
      setError(
        currentSheet
          ? "ไม่พบแถวรายชื่อนักเรียนในชีตนี้ ลองเลือกชีตอื่น หรือตรวจว่าคอลัมน์เรียงตามแม่แบบของโรงเรียน"
          : "ไม่พบแถวรายชื่อนักเรียน ตรวจว่าคัดลอกจากแถวหัวตารางลงไปถึงแถวสุดท้าย",
      );
      return;
    }
    if (parsed.items.length > MAX_ROWS) {
      setError(`นำเข้าได้ครั้งละไม่เกิน ${MAX_ROWS} แถว`);
      return;
    }

    setItems(parsed.items);
    setSkipped(parsed.skipped);

    const rows = parsed.items
      .filter((i) => i.clientErrors.length === 0)
      .map((i) => i.row);

    if (rows.length === 0) {
      setDisplay(merge(parsed.items, null));
      return;
    }

    start(async () => {
      const res = await importStudents(classroomId, rows, false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDisplay(merge(parsed.items, res.data));
    });
  };

  const commit = () => {
    setError(null);
    start(async () => {
      const res = await importStudents(classroomId, sendable(), true);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDisplay(merge(items, res.data));
      setDone(true);
      setText("");
      clearFile(); // ทิ้งข้อมูลดิบของไฟล์ทันทีหลังนำเข้าเสร็จ
      onImported(res.data.summary);
    });
  };

  const counts = display
    ? {
        create: display.filter((d) => d.action === "create").length,
        update: display.filter((d) => d.action === "update").length,
        error: display.filter((d) => d.action === "error").length,
      }
    : null;
  const importable = counts ? counts.create + counts.update : 0;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="import-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      onClose={() => {
        if (open) {
          reset();
          onClose();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-4xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-0 shadow-[0_24px_60px_rgba(130,28,41,0.25)] backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div>
          <h2 id="import-title" className="font-bold text-[var(--heading)]">
            นำเข้านักเรียนจาก Excel
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            เลือกไฟล์ .xlsx หรือคัดลอกตารางมาวาง แล้วดูตัวอย่างผลก่อนบันทึก
          </p>
        </div>
        <button
          type="button"
          onClick={closeModal}
          disabled={busy}
          aria-label="ปิดหน้าต่าง"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-xl text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] disabled:opacity-50"
        >
          ×
        </button>
      </div>

      <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5 sm:p-6">
        {!display ? (
          <>
            <label className="block space-y-2">
              <span className="text-xs font-bold text-[var(--heading)]">
                ชั้นเรียนปลายทาง <span className="text-red-500">*</span>
              </span>
              <select
                className={inputCls}
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                disabled={busy}
              >
                <option value="">เลือกชั้นเรียน...</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {classLabel(c)} · ปีการศึกษา {c.academicYear}
                  </option>
                ))}
              </select>
            </label>

            {/* เลือกไฟล์ */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-[var(--heading)]">
                ไฟล์ Excel (.xlsx)
              </span>

              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={onFile}
                className="hidden"
              />

              {hasFile && currentSheet ? (
                <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[#fffcfa] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--heading)]">
                      {fileName}
                    </span>

                    {sheets.length > 1 && (
                      <select
                        className={`${inputCls} !w-auto !py-2`}
                        value={sheetIndex}
                        onChange={(e) => setSheetIndex(Number(e.target.value))}
                        disabled={busy}
                        aria-label="เลือกชีต"
                      >
                        {sheets.map((s, i) => (
                          <option key={`${s.name}-${i}`} value={i}>
                            {s.name} ({s.count} แถว)
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={clearFile}
                      disabled={busy}
                      className="cursor-pointer rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50"
                    >
                      เอาไฟล์ออก
                    </button>
                  </div>

                  <p
                    className={`text-xs ${
                      currentSheet.count > 0 ? "text-[#16845B]" : "text-[#9A5612]"
                    }`}
                  >
                    {currentSheet.count > 0
                      ? `พบรายชื่อนักเรียน ${currentSheet.count} แถวในชีตนี้`
                      : "ไม่พบรายชื่อนักเรียนในชีตนี้ ลองเลือกชีตอื่น"}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] bg-[#fffcfa] px-4 py-6 text-sm font-semibold text-[var(--heading)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reading ? "กำลังอ่านไฟล์..." : "เลือกไฟล์ .xlsx"}
                </button>
              )}
            </div>

            {/* วางข้อมูล (แสดงเมื่อยังไม่ได้เลือกไฟล์) */}
            {!hasFile && (
              <>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span className="h-px flex-1 bg-[var(--border)]" />
                  หรือคัดลอกตารางมาวาง
                  <span className="h-px flex-1 bg-[var(--border)]" />
                </div>

                <textarea
                  className={`${inputCls} h-48 resize-y font-mono text-xs`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={busy}
                  spellCheck={false}
                  aria-label="วางข้อมูลจากตาราง"
                  placeholder="คัดลอกตารางตั้งแต่แถวหัวตารางลงไปถึงแถวสุดท้าย แล้ววางที่นี่"
                />
              </>
            )}

            <p className="rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
              ไฟล์ถูกอ่านในเบราว์เซอร์ของคุณ <b>ไม่ถูกอัปโหลด</b> ระบบนำเข้าเฉพาะ
              เลขที่ รหัส คำนำหน้า ชื่อ นามสกุล วันเกิด บิดา มารดา ผู้ปกครอง
              และเบอร์โทร ส่วนเลขบัตรประชาชน ที่อยู่ สัญชาติ และเอกสาร
              จะถูกข้ามและไม่ถูกส่งไปที่เซิร์ฟเวอร์
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                สร้างใหม่ {counts?.create}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
                อัปเดต {counts?.update}
              </span>
              <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">
                ข้าม {counts?.error}
              </span>
            </div>

            {done && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
              >
                นำเข้าเรียบร้อยแล้ว
                {counts &&
                  counts.error > 0 &&
                  " แถวที่ถูกข้ามแก้ในไฟล์ต้นฉบับแล้วนำเข้าซ้ำได้ ไม่เกิดข้อมูลซ้ำ"}
              </div>
            )}

            {skipped > 0 && (
              <p className="text-xs text-[var(--muted)]">
                ข้าม {skipped} แถวที่ไม่ใช่รายชื่อ (ปกติคือชื่อเรื่องและหัวตาราง)
                ถ้ามากกว่านั้นให้ตรวจไฟล์ต้นฉบับ
              </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[var(--surface-soft)] text-[11px] font-bold text-[var(--muted)]">
                    <th className="px-4 py-3">เลขที่</th>
                    <th className="px-4 py-3">รหัส</th>
                    <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                    <th className="px-4 py-3">ผลตรวจ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {display.map((d) => {
                    const st = ACTION_STYLE[d.action];
                    return (
                      <tr
                        key={d.line}
                        className={d.action === "error" ? "bg-red-50/40" : ""}
                      >
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {d.number ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[var(--primary)]">
                          {d.studentCode || "-"}
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--heading)]">
                          {d.name || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}
                          >
                            {done ? st.done : st.label}
                          </span>
                          {d.errors.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-xs text-red-700">
                              {d.errors.map((e) => (
                                <li key={e}>• {e}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] px-5 py-4 sm:px-6">
        {done ? (
          <button
            type="button"
            onClick={closeModal}
            className="cursor-pointer rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-bold !text-white shadow-[var(--shadow-button)]"
          >
            ปิด
          </button>
        ) : !display ? (
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={busy}
              className="cursor-pointer rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={check}
              disabled={busy || (!hasFile && !text.trim())}
              className="cursor-pointer rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-bold !text-white shadow-[var(--shadow-button)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "กำลังตรวจสอบ..." : "ตรวจสอบข้อมูล"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setDisplay(null);
                setError(null);
              }}
              disabled={busy}
              className="cursor-pointer rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50"
            >
              กลับไปแก้ไข
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={busy || importable === 0}
              className="cursor-pointer rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-bold !text-white shadow-[var(--shadow-button)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "กำลังนำเข้า..." : `นำเข้า ${importable} รายการ`}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}