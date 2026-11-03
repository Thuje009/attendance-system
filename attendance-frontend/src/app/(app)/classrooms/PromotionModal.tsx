"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { classLabel } from "@/src/lib/classroom";
import type { PromotionPreview, PromotionResult } from "@/src/lib/promotion";
import { applyPromotion, previewPromotion, undoPromotion } from "./actions";

type Step = "setup" | "preview" | "done";

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-[#fffcfa] px-4 py-3 text-sm text-[var(--heading)] outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[#b42332]/10 disabled:cursor-not-allowed disabled:opacity-50";

function Chip({ cls, children }: { cls: string; children: ReactNode }) {
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${cls}`}>
      {children}
    </span>
  );
}

// แสดงเมื่อมีการเปิดหน้าต่างเท่านั้น (parent ใส่เงื่อนไข) ค่าเริ่มต้นจึงใหม่เสมอ
export default function PromotionModal({
  years,
  onClose,
  onViewYear,
}: {
  years: number[];
  onClose: () => void;
  onViewYear: (year: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const latest = years[0];

  const [step, setStep] = useState<Step>("setup");
  const [fromYear, setFromYear] = useState(latest ? String(latest) : "");
  const [toYear, setToYear] = useState(latest ? String(latest + 1) : "");
  const [copyTeachers, setCopyTeachers] = useState(false);
  const [graduate, setGraduate] = useState(true);
  const [preview, setPreview] = useState<PromotionPreview | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<PromotionResult | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, start] = useTransition();

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  const closeModal = () => {
    if (!pending) dialogRef.current?.close(); // → onClose ของ dialog
  };

  const totals = useMemo(() => {
    const t = { move: 0, graduate: 0, already: 0, repeat: 0, classes: 0 };
    if (!preview) return t;
    for (const g of preview.groups) {
      if (g.target && !g.target.exists) t.classes++;
      for (const s of g.students) {
        if (s.status === "already") t.already++;
        else if (excluded.has(s.studentId)) t.repeat++;
        else if (g.target) t.move++;
        else t.graduate++;
      }
    }
    return t;
  }, [preview, excluded]);

  const toggle = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const check = () => {
    setNotice(null);
    const from = Number(fromYear);
    const to = Number(toYear);

    if (!Number.isInteger(from) || !Number.isInteger(to) || to <= from) {
      setNotice({ ok: false, text: "ปีปลายทางต้องมากกว่าปีต้นทาง" });
      return;
    }

    start(async () => {
      const res = await previewPromotion({
        fromYear: from,
        toYear: to,
        excludeStudentIds: [],
      });
      if (!res.ok) {
        setNotice({ ok: false, text: res.error });
        return;
      }
      setPreview(res.data);
      setExcluded(new Set());
      setStep("preview");
    });
  };

  const apply = () => {
    if (!preview) return;
    setNotice(null);

    start(async () => {
      const res = await applyPromotion({
        fromYear: preview.fromYear,
        toYear: preview.toYear,
        copyTeachers,
        graduate,
        excludeStudentIds: [...excluded],
      });
      if (!res.ok) {
        setNotice({ ok: false, text: res.error });
        return;
      }
      setResult(res.data);
      setStep("done");
    });
  };

  const undo = () => {
    const y = Number(toYear);
    if (!Number.isInteger(y)) return;
    if (
      !window.confirm(
        `ยกเลิกการเลื่อนชั้นของปีการศึกษา ${y}?\n\n` +
          `จะลบชั้นเรียนของปี ${y} พร้อมการลงทะเบียนนักเรียนและครูในปีนั้นทั้งหมด ` +
          `(ข้อมูลปีเก่าไม่กระทบ)\n` +
          `นักเรียนที่ถูกปิดใช้งานเพราะจบ ป.6 ต้องเปิดใช้งานกลับเอง\n\n` +
          `ทำได้เฉพาะปีที่ยังไม่มีประวัติเช็คชื่อ`,
      )
    ) {
      return;
    }

    start(async () => {
      const res = await undoPromotion(y);
      setNotice(
        res.ok
          ? { ok: true, text: `ยกเลิกชั้นเรียนของปี ${y} เรียบร้อยแล้ว` }
          : { ok: false, text: res.error },
      );
    });
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="promotion-title"
      onCancel={(e) => {
        if (pending) e.preventDefault();
      }}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-0 shadow-[0_24px_60px_rgba(130,28,41,0.25)] backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div>
          <h2 id="promotion-title" className="font-bold text-[var(--heading)]">
            เลื่อนชั้นขึ้นปีการศึกษาใหม่
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {step === "setup" && "เลือกปีการศึกษา แล้วดูตัวอย่างก่อนบันทึก"}
            {step === "preview" && "ตรวจรายการ ติ๊ก “ไม่เลื่อน” ให้นักเรียนที่ซ้ำชั้น"}
            {step === "done" && "เสร็จสิ้น"}
          </p>
        </div>
        <button
          type="button"
          onClick={closeModal}
          disabled={pending}
          aria-label="ปิดหน้าต่าง"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-xl text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] disabled:opacity-50"
        >
          ×
        </button>
      </div>

      <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5 sm:p-6">
        {step === "setup" && (
          <>
            {years.length === 0 ? (
              <p className="rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted)]">
                ยังไม่มีชั้นเรียนให้เลื่อน สร้างชั้นเรียนของปีปัจจุบันก่อน
              </p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-xs font-bold text-[var(--heading)]">
                      เลื่อนจากปีการศึกษา
                    </span>
                    <select
                      className={inputCls}
                      value={fromYear}
                      disabled={pending}
                      onChange={(e) => {
                        setFromYear(e.target.value);
                        setToYear(String(Number(e.target.value) + 1));
                      }}
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-bold text-[var(--heading)]">
                      ไปยังปีการศึกษา
                    </span>
                    <input
                      className={inputCls}
                      type="number"
                      min={2500}
                      step={1}
                      value={toYear}
                      disabled={pending}
                      onChange={(e) => setToYear(e.target.value)}
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={graduate}
                      disabled={pending}
                      onChange={(e) => setGraduate(e.target.checked)}
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-[#b42332]"
                    />
                    <span>
                      <b className="text-[var(--heading)]">
                        ปิดใช้งานนักเรียนที่จบ ป.6
                      </b>{" "}
                      <span className="text-[var(--muted)]">
                        (เก็บประวัติเช็คชื่อไว้ครบ เปิดใช้งานกลับได้)
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={copyTeachers}
                      disabled={pending}
                      onChange={(e) => setCopyTeachers(e.target.checked)}
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-[#b42332]"
                    />
                    <span>
                      <b className="text-[var(--heading)]">
                        คัดลอกครูประจำชั้นไปยังชั้นใหม่
                      </b>{" "}
                      <span className="text-[var(--muted)]">
                        (ถ้าไม่ติ๊ก ต้องมอบหมายครูใหม่เอง)
                      </span>
                    </span>
                  </label>
                </div>

                <p className="rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
                  การจับคู่: อ.1 → อ.2 → อ.3 → ป.1 → ... → ป.6 (จบการศึกษา)
                  ห้องเดิมไปห้องเดิม ระบบสร้างชั้นของปีใหม่ให้ถ้ายังไม่มี
                  เลขที่คงเดิม ถ้าชนกันจะเว้นว่าง ข้อมูลและประวัติของปีเก่าไม่ถูกแก้ไข
                </p>
              </>
            )}
          </>
        )}

        {step === "preview" && preview && (
          <>
            <div className="flex flex-wrap gap-2">
              <Chip cls="bg-emerald-50 text-emerald-700">
                เลื่อนชั้น {totals.move} คน
              </Chip>
              <Chip cls="bg-blue-50 text-blue-700">
                จบการศึกษา {totals.graduate} คน
              </Chip>
              <Chip cls="bg-amber-50 text-amber-700">
                ไม่เลื่อน {totals.repeat} คน
              </Chip>
              <Chip cls="bg-[var(--surface-soft)] text-[var(--heading)]">
                สร้างชั้นใหม่ {totals.classes} ชั้น
              </Chip>
              {totals.already > 0 && (
                <Chip cls="bg-gray-100 text-gray-600">
                  อยู่ในปีใหม่แล้ว {totals.already} คน
                </Chip>
              )}
            </div>

            <p className="text-xs text-[var(--muted)]">
              {preview.fromYear} → {preview.toYear} · ครูประจำชั้น:{" "}
              {copyTeachers ? "คัดลอกไปด้วย" : "ไม่คัดลอก"} · นักเรียนที่จบ ป.6:{" "}
              {graduate ? "ปิดใช้งาน" : "คงไว้"}
            </p>

            <div className="space-y-3">
              {preview.groups.map((g) => {
                const going = g.students.filter(
                  (s) => s.status === "move" && !excluded.has(s.studentId),
                ).length;

                return (
                  <details
                    key={g.source.id}
                    className="rounded-xl border border-[var(--border)] bg-white"
                  >
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <span className="font-bold text-[var(--heading)]">
                        {classLabel(g.source)}{" "}
                        <span className="text-[var(--muted)]">→</span>{" "}
                        {g.target ? classLabel(g.target) : "จบการศึกษา"}
                      </span>
                      <span className="flex items-center gap-2">
                        {g.target && (
                          <Chip
                            cls={
                              g.target.exists
                                ? "bg-gray-100 text-gray-600"
                                : "bg-[#fff0f1] text-[#b42332]"
                            }
                          >
                            {g.target.exists ? "มีชั้นอยู่แล้ว" : "สร้างชั้นใหม่"}
                          </Chip>
                        )}
                        <Chip cls="bg-[var(--badge-bg)] text-[var(--badge-text)]">
                          {going} คน
                        </Chip>
                      </span>
                    </summary>

                    <div className="space-y-3 border-t border-[var(--border)] p-4">
                      {g.numberCleared > 0 && (
                        <p className="text-xs text-[#9A5612]">
                          เลขที่ชนกับชั้นใหม่ {g.numberCleared} คน
                          จะเว้นว่างไว้ให้จัดเลขที่ภายหลัง
                        </p>
                      )}

                      {g.students.length === 0 ? (
                        <p className="text-xs text-[var(--muted)]">
                          ไม่มีนักเรียนที่ใช้งานอยู่ในชั้นนี้
                        </p>
                      ) : (
                        <table className="w-full border-collapse text-left text-sm">
                          <tbody className="divide-y divide-[var(--border)]">
                            {g.students.map((s) => (
                              <tr key={s.studentId}>
                                <td className="w-28 py-2 text-xs text-[var(--muted)]">
                                  {s.number ?? "-"}
                                  {g.target && s.status === "move"
                                    ? ` → ${s.newNumber ?? "ว่าง"}`
                                    : ""}
                                </td>
                                <td className="py-2 font-medium text-[var(--heading)]">
                                  {s.name}
                                </td>
                                <td className="py-2 text-right">
                                  {s.status === "already" ? (
                                    <span className="text-xs text-[var(--muted)]">
                                      อยู่ในปีใหม่แล้ว
                                    </span>
                                  ) : (
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={excluded.has(s.studentId)}
                                        onChange={() => toggle(s.studentId)}
                                        disabled={pending}
                                        className="h-4 w-4 cursor-pointer accent-[#b42332]"
                                      />
                                      ไม่เลื่อน
                                    </label>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </>
        )}

        {step === "done" && result && (
          <>
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            >
              เลื่อนชั้นเรียบร้อยแล้ว
            </div>

            <ul className="space-y-1.5 text-sm text-[var(--heading)]">
              <li>สร้างชั้นใหม่ {result.classesToCreate} ชั้น</li>
              <li>เลื่อนชั้น {result.move} คน</li>
              <li>จบการศึกษา (ปิดใช้งาน) {result.graduated} คน</li>
              <li>ไม่เลื่อน {result.excluded} คน</li>
              {result.already > 0 && (
                <li>อยู่ในปีใหม่แล้ว {result.already} คน</li>
              )}
            </ul>

            <p className="rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
              ขั้นต่อไป: มอบหมายครูประจำชั้นใหม่ (ถ้าไม่ได้คัดลอก)
              และจัดนักเรียนที่ไม่เลื่อนเข้าชั้นของปีใหม่ที่หน้า &quot;นักเรียน&quot;
              ด้วยปุ่ม &quot;แก้ไข&quot;
            </p>
          </>
        )}

        {notice && (
          <div
            role="alert"
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              notice.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.text}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4 sm:px-6">
        <div>
          {step === "setup" && years.length > 0 && (
            <button
              type="button"
              onClick={undo}
              disabled={pending}
              className="cursor-pointer text-xs font-semibold text-[var(--muted)] underline-offset-2 hover:text-red-600 hover:underline disabled:opacity-50"
            >
              เลื่อนผิด? ยกเลิกชั้นเรียนของปี {toYear || "..."}
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {step === "setup" && (
            <>
              <button
                type="button"
                onClick={closeModal}
                disabled={pending}
                className="cursor-pointer rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={check}
                disabled={pending || years.length === 0}
                className="cursor-pointer rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-bold !text-white shadow-[var(--shadow-button)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "กำลังตรวจสอบ..." : "ดูตัวอย่าง"}
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("setup");
                  setNotice(null);
                }}
                disabled={pending}
                className="cursor-pointer rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50"
              >
                กลับไปแก้ไข
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={pending || totals.move + totals.graduate === 0}
                className="cursor-pointer rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-bold !text-white shadow-[var(--shadow-button)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending
                  ? "กำลังเลื่อนชั้น..."
                  : `ยืนยันเลื่อนชั้น ${totals.move + totals.graduate} คน`}
              </button>
            </>
          )}

          {step === "done" && result && (
            <>
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)]"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={() => {
                  onViewYear(result.toYear);
                  dialogRef.current?.close();
                }}
                className="cursor-pointer rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-bold !text-white shadow-[var(--shadow-button)]"
              >
                ดูชั้นเรียนปี {result.toYear}
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}