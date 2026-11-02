"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import type { ClassroomOption } from "./StudentsManager";

export type CreateStudentInput = {
  studentCode: string;
  firstName: string;
  lastName: string;
  classroomId?: string;
  number?: number;
};

export type CreateStudentResult = { ok: true } | { ok: false; error: string };

type AddStudentModalProps = {
  open: boolean;
  classrooms: ClassroomOption[];
  onClose: () => void;
  onSubmit: (data: CreateStudentInput) => Promise<CreateStudentResult>;
};

const inputCls = `
  w-full rounded-xl border border-[var(--border)]
  bg-[#fffcfa] px-4 py-3 text-sm text-[var(--heading)]
  outline-none transition-all
  placeholder:text-[#aaa]
  focus:border-[var(--primary)]
  focus:ring-4 focus:ring-[#b42332]/10
  disabled:cursor-not-allowed disabled:opacity-50
`;

export default function AddStudentModal({
  open,
  classrooms,
  onClose,
  onSubmit,
}: AddStudentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const focusAfterSave = useRef(false);

  const [studentCode, setStudentCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [number, setNumber] = useState("");
  const [keepOpen, setKeepOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [pending, startTransition] = useTransition();

  // เปิด/ปิด dialog ตาม prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => codeRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // โฟกัสช่องรหัสหลังบันทึกต่อเนื่อง (ต้องรอให้ input หลุดจาก disabled ก่อน)
  useEffect(() => {
    if (!pending && focusAfterSave.current) {
      focusAfterSave.current = false;
      codeRef.current?.focus();
    }
  }, [pending]);

  const isDirty = !!(studentCode || firstName || lastName || number);

  const resetFields = () => {
    setStudentCode("");
    setFirstName("");
    setLastName("");
    setNumber("");
    // คงห้องเรียนที่เลือกไว้ เพื่อเพิ่มนักเรียนห้องเดิมต่อได้
  };

  const closeModal = () => {
    if (pending) return;
    resetFields();
    onClose();
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!studentCode.trim() || !firstName.trim() || !lastName.trim()) {
      setMsg({ ok: false, text: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ" });
      return;
    }

    let parsedNumber: number | undefined;
    if (classroomId && number) {
      parsedNumber = Number(number);
      if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
        setMsg({ ok: false, text: "เลขที่ต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป" });
        return;
      }
    }

    setMsg(null);

    const input: CreateStudentInput = {
      studentCode: studentCode.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      classroomId: classroomId || undefined,
      number: parsedNumber,
    };

    startTransition(async () => {
      try {
        const result = await onSubmit(input);

        if (!result.ok) {
          setMsg({ ok: false, text: result.error });
          return;
        }

        if (keepOpen) {
          // เพิ่มต่อเนื่อง: ล้างชื่อ ขยับเลขที่ไปคนถัดไป แล้วอยู่ในหน้าต่างเดิม
          setStudentCode("");
          setFirstName("");
          setLastName("");
          setNumber(parsedNumber ? String(parsedNumber + 1) : "");
          setMsg({
            ok: true,
            text: `เพิ่ม ${input.firstName} ${input.lastName} เรียบร้อยแล้ว`,
          });
          focusAfterSave.current = true;
        } else {
          // ปิดหน้าต่าง: ข้อความสำเร็จให้ parent แสดงแทน
          resetFields();
          onClose();
        }
      } catch {
        setMsg({ ok: false, text: "ไม่สามารถเพิ่มนักเรียนได้ กรุณาลองใหม่" });
      }
    });
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="add-student-title"
      onCancel={(e) => {
        // กัน Esc ปิดหน้าต่างระหว่างกำลังบันทึก
        if (pending) e.preventDefault();
      }}
      onClose={() => {
        // เกิดทั้งตอนกด Esc และตอนโค้ดสั่ง close() ล้างข้อความเสมอ
        setMsg(null);
        if (open) onClose();
      }}
      onClick={(e) => {
        // คลิกพื้นหลังปิดได้เฉพาะตอนยังไม่ได้พิมพ์อะไร (กันข้อมูลหายจากการคลิกพลาด)
        if (e.target === dialogRef.current && !isDirty) closeModal();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-0 shadow-[0_24px_60px_rgba(130,28,41,0.25)] backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0f1] text-2xl font-bold text-[#b42332]">
            +
          </div>
          <div>
            <h2
              id="add-student-title"
              className="font-bold text-[var(--heading)]"
            >
              เพิ่มนักเรียนใหม่
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              กรอกข้อมูลนักเรียนเพื่อเพิ่มเข้าสู่ระบบ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={closeModal}
          disabled={pending}
          aria-label="ปิดหน้าต่าง"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-xl text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--heading)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          ×
        </button>
      </div>

      <form
        className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6"
        onSubmit={submit}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-xs font-bold text-[var(--heading)]">
              รหัสประจำตัว <span className="text-red-500">*</span>
            </span>
            <input
              ref={codeRef}
              className={inputCls}
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="เช่น 10001"
              required
              disabled={pending}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-[var(--heading)]">
              ชื่อ <span className="text-red-500">*</span>
            </span>
            <input
              className={inputCls}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="ชื่อจริง"
              required
              disabled={pending}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-[var(--heading)]">
              นามสกุล <span className="text-red-500">*</span>
            </span>
            <input
              className={inputCls}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="นามสกุล"
              required
              disabled={pending}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-[var(--heading)]">
              ห้องเรียน
            </span>
            <select
              className={inputCls}
              value={classroomId}
              onChange={(e) => {
                setClassroomId(e.target.value);
                setNumber("");
              }}
              disabled={pending}
            >
              <option value="">ยังไม่กำหนดห้องเรียน</option>

              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.level === "KINDERGARTEN" ? "อ." : "ป."}
                  {c.grade}/{c.room} · ปีการศึกษา {c.academicYear}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-[var(--heading)]">
              เลขที่
            </span>
            <input
              className={inputCls}
              type="number"
              min={1}
              step={1}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder={classroomId ? "เช่น 1" : "เลือกห้องเรียนก่อน"}
              disabled={!classroomId || pending}
            />
          </label>
        </div>

        {!classrooms.length && (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <span className="text-lg">!</span>
            <div>
              <p className="font-bold">ยังไม่มีห้องเรียน</p>
              <p className="mt-1 text-xs leading-relaxed">
                เพิ่มนักเรียนโดยยังไม่กำหนดห้องได้ หรือไปสร้างห้องเรียนก่อนก็ได้
              </p>
            </div>
          </div>
        )}

        {msg && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${msg.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            {msg.text}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={keepOpen}
              onChange={(e) => setKeepOpen(e.target.checked)}
              disabled={pending}
              className="h-4 w-4 cursor-pointer accent-[#b42332]"
            />
            เพิ่มต่อเนื่อง (ไม่ปิดหน้าต่าง)
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={pending}
              className="cursor-pointer rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] disabled:opacity-50"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={
                pending ||
                !studentCode.trim() ||
                !firstName.trim() ||
                !lastName.trim()
              }
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-bold !text-white shadow-[var(--shadow-button)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึก"
              )}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}