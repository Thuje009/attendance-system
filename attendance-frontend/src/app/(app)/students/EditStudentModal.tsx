
"use client";

import {
    useEffect,
    useRef,
    useState,
    useTransition,
    type FormEvent,
    type ReactNode,
} from "react";
import { classLabel } from "@/src/lib/classroom";
import type { ClassroomOption, StudentRow } from "./StudentsManager";

export type UpdateStudentInput = {
    studentCode: string;
    prefix: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    fatherName: string;
    motherName: string;
    guardianName: string;
    phone: string;
    placement?: {
        classroomId: string | null;
        number?: number | null;
        from?: string | null;
    };
};

type Result = { ok: true } | { ok: false; error: string };

const inputCls =
    "w-full rounded-xl border border-[#eadbd8] bg-white px-4 py-3 text-sm font-medium text-[#54232b] outline-none transition-all placeholder:font-normal placeholder:text-[#b9a5a2] hover:border-[#d7aaa5] focus:border-[#a92d3d] focus:ring-4 focus:ring-[#a92d3d]/10 disabled:cursor-not-allowed disabled:bg-[#f8f5f4] disabled:opacity-60";

function Field({
    label,
    required,
    className = "",
    children,
}: {
    label: string;
    required?: boolean;
    className?: string;
    children: ReactNode;
}) {
    return (
        <label className={`block min-w-0 space-y-2 ${className}`}>
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#63343a]">
                {label}
                {required && <span className="text-[#b42332]">*</span>}
            </span>
            {children}
        </label>
    );
}

function Section({
    icon,
    title,
    description,
    children,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-[#f0e3df] bg-white shadow-[0_3px_14px_rgba(91,35,43,0.035)]">
            <div className="flex items-center gap-3 border-b border-[#f3e9e6] bg-gradient-to-r from-[#fffaf8] to-white px-5 py-4 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#a92d3d]/[0.08] text-[#a92d3d]">
                    {icon}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[#54232b]">{title}</h3>
                    <p className="mt-0.5 text-[11px] text-[#9b7c7d]">{description}</p>
                </div>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

function UserIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c.5-4 2.8-6 7-6s6.5 2 7 6" strokeLinecap="round" />
        </svg>
    );
}

function FamilyIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="8" r="3" />
            <circle cx="17" cy="9" r="2.5" />
            <path d="M2.5 20c.4-3.7 2.5-5.5 6.5-5.5s6.1 1.8 6.5 5.5M15 15c3.8-.7 5.9 1 6.5 4.5" strokeLinecap="round" />
        </svg>
    );
}

function SchoolIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
            <path d="m3 9 9-6 9 6M5 10v10h14V10M9 20v-6h6v6M9 10h.01M15 10h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
            <path d="m18 6-12 12M6 6l12 12" strokeLinecap="round" />
        </svg>
    );
}

export default function EditStudentModal({
    student,
    classrooms,
    onClose,
    onSubmit,
}: {
    student: StudentRow;
    classrooms: ClassroomOption[];
    onClose: () => void;
    onSubmit: (id: string, input: UpdateStudentInput) => Promise<Result>;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    const current = student.enrollments[0];
    const currentClassroomId = current?.classroom.id ?? "";
    const currentNumber = current?.number != null ? String(current.number) : "";

    const [studentCode, setStudentCode] = useState(student.studentCode);
    const [prefix, setPrefix] = useState(student.prefix ?? "");
    const [firstName, setFirstName] = useState(student.firstName);
    const [lastName, setLastName] = useState(student.lastName);
    const [birthDate, setBirthDate] = useState(student.birthDate?.slice(0, 10) ?? "");
    const [fatherName, setFatherName] = useState(student.fatherName ?? "");
    const [motherName, setMotherName] = useState(student.motherName ?? "");
    const [guardianName, setGuardianName] = useState(student.guardianName ?? "");
    const [phone, setPhone] = useState(student.phone ?? "");
    const [classroomId, setClassroomId] = useState(currentClassroomId);
    const [number, setNumber] = useState(currentNumber);

    const [error, setError] = useState<string | null>(null);
    const [pending, start] = useTransition();

    useEffect(() => {
        const d = dialogRef.current;
        if (d && !d.open) d.showModal();
    }, []);

    const closeModal = () => {
        if (!pending) dialogRef.current?.close();
    };

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!studentCode.trim() || !firstName.trim() || !lastName.trim()) {
            setError("รหัสประจำตัว ชื่อ และนามสกุลต้องไม่ว่าง");
            return;
        }

        let parsedNumber: number | null = null;

        if (classroomId && number.trim()) {
            const n = Number(number);
            if (!Number.isInteger(n) || n < 1) {
                setError("เลขที่ต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป");
                return;
            }
            parsedNumber = n;
        }

        setError(null);

        const input: UpdateStudentInput = {
            studentCode: studentCode.trim(),
            prefix: prefix.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            birthDate,
            fatherName: fatherName.trim(),
            motherName: motherName.trim(),
            guardianName: guardianName.trim(),
            phone: phone.trim(),
        };

        const placementChanged =
            classroomId !== currentClassroomId ||
            (classroomId !== "" && number.trim() !== currentNumber);

        if (placementChanged) {
            input.placement = classroomId
                ? { classroomId, number: parsedNumber }
                : { classroomId: null, from: currentClassroomId || null };
        }

        start(async () => {
            const res = await onSubmit(student.id, input);

            if (!res.ok) {
                setError(res.error);
                return;
            }

            dialogRef.current?.close();
        });
    };

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="edit-student-title"
            onCancel={(e) => {
                if (pending) e.preventDefault();
            }}
            onClose={onClose}
            className="m-auto flex h-[92dvh] max-h-[92dvh] w-[calc(100%-1.25rem)] max-w-3xl flex-col overflow-hidden rounded-[26px] border border-[#eadbd8] bg-[#fffdfc] p-0 text-[#54232b] shadow-[0_30px_100px_rgba(60,15,23,0.3)] backdrop:bg-[#241014]/50 backdrop:backdrop-blur-md"
        >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#681b2a] via-[#922638] to-[#b63c43] px-5 py-5 text-white sm:px-7 sm:py-6">
                <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -right-2 -top-16 h-48 w-48 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-[#e8bd70]/10 blur-2xl" />

                <div className="relative flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#f5d58c] shadow-inner backdrop-blur-sm sm:h-14 sm:w-14">
                            <UserIcon />
                        </div>
                        <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[#f2d28d]/30 bg-[#f2d28d]/15 px-2.5 py-1 text-[9px] font-extrabold tracking-[0.16em] text-[#f6d998]">
                                    STUDENT PROFILE
                                </span>
                                <span className="text-[10px] font-medium text-white/60">EDIT MODE</span>
                            </div>
                            <h2 id="edit-student-title" className="text-lg font-extrabold tracking-tight sm:text-xl">
                                แก้ไขข้อมูลนักเรียน
                            </h2>
                            <p className="mt-1 truncate text-xs text-white/70">
                                {student.firstName} {student.lastName} · {student.studentCode}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeModal}
                        disabled={pending}
                        aria-label="ปิดหน้าต่าง"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white disabled:opacity-40"
                    >
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#fcf9f7] p-4 sm:p-6">
                    <Section
                        icon={<UserIcon />}
                        title="ข้อมูลนักเรียน"
                        description="ข้อมูลประจำตัวและรายละเอียดพื้นฐาน"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="รหัสประจำตัว" required>
                                <input
                                    className={inputCls}
                                    value={studentCode}
                                    onChange={(e) => setStudentCode(e.target.value)}
                                    disabled={pending}
                                    placeholder="กรอกรหัสประจำตัว"
                                />
                            </Field>

                            <Field label="คำนำหน้า">
                                <input
                                    className={inputCls}
                                    list="prefix-options"
                                    value={prefix}
                                    onChange={(e) => setPrefix(e.target.value)}
                                    disabled={pending}
                                    placeholder="เช่น เด็กชาย"
                                />
                                <datalist id="prefix-options">
                                    <option value="เด็กชาย" />
                                    <option value="เด็กหญิง" />
                                </datalist>
                            </Field>

                            <Field label="ชื่อ" required>
                                <input
                                    className={inputCls}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={pending}
                                    placeholder="กรอกชื่อ"
                                />
                            </Field>

                            <Field label="นามสกุล" required>
                                <input
                                    className={inputCls}
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={pending}
                                    placeholder="กรอกนามสกุล"
                                />
                            </Field>

                            <Field label="วันเกิด" className="sm:col-span-2">
                                <input
                                    className={inputCls}
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    disabled={pending}
                                />
                            </Field>
                        </div>
                    </Section>

                    <Section
                        icon={<FamilyIcon />}
                        title="ผู้ปกครองและการติดต่อ"
                        description="ข้อมูลครอบครัวและช่องทางติดต่อ"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="บิดา">
                                <input className={inputCls} value={fatherName} onChange={(e) => setFatherName(e.target.value)} disabled={pending} placeholder="ชื่อ-นามสกุลบิดา" />
                            </Field>

                            <Field label="มารดา">
                                <input className={inputCls} value={motherName} onChange={(e) => setMotherName(e.target.value)} disabled={pending} placeholder="ชื่อ-นามสกุลมารดา" />
                            </Field>

                            <Field label="ผู้ปกครอง">
                                <input className={inputCls} value={guardianName} onChange={(e) => setGuardianName(e.target.value)} disabled={pending} placeholder="ชื่อผู้ปกครอง" />
                            </Field>

                            <Field label="เบอร์โทร">
                                <input className={inputCls} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={pending} placeholder="เช่น 0812345678" />
                            </Field>
                        </div>
                    </Section>

                    <Section
                        icon={<SchoolIcon />}
                        title="ชั้นเรียน"
                        description="กำหนดชั้นเรียนและเลขที่ของนักเรียน"
                    >
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="ชั้นเรียน" className="sm:col-span-2">
                                <select
                                    className={inputCls}
                                    value={classroomId}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        setClassroomId(next);
                                        setNumber(next === currentClassroomId ? currentNumber : "");
                                    }}
                                    disabled={pending}
                                >
                                    <option value="">ยังไม่กำหนดชั้นเรียน</option>
                                    {classrooms.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {classLabel(c)} · ปีการศึกษา {c.academicYear}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="เลขที่">
                                <input
                                    className={inputCls}
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    disabled={!classroomId || pending}
                                    placeholder={classroomId ? "เช่น 1" : "เลือกชั้นก่อน"}
                                />
                            </Field>
                        </div>

                        <div className="mt-5 flex gap-3 rounded-xl border border-[#ead9b9] bg-[#fff9eb] p-4">
                            <span className="mt-0.5 shrink-0 text-[#a77825]">ⓘ</span>
                            <p className="text-xs leading-relaxed text-[#86652e]">
                                ย้ายชั้นได้เมื่อนักเรียนยังไม่มีประวัติเช็คชื่อในชั้นเดิม
                                หากเลือกชั้นของปีการศึกษาใหม่ ระบบจะเพิ่มนักเรียนในปีนั้นโดยเก็บประวัติชั้นเดิมไว้
                                หากนักเรียนออกจากโรงเรียน ให้ใช้ปุ่ม “ปิดใช้งาน” เพื่อเก็บประวัติไว้ครบถ้วน
                            </p>
                        </div>
                    </Section>

                    {error && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700"
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">!</span>
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                {/* Sticky Footer */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#eee1dd] bg-white px-4 py-4 sm:px-7">
                    <p className="hidden text-[11px] text-[#a18a88] sm:block">
                        <span className="text-[#b42332]">*</span> จำเป็นต้องกรอก
                    </p>

                    <div className="ml-auto flex gap-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={pending}
                            className="rounded-xl border border-[#eadbd8] bg-white px-4 py-3 text-sm font-bold text-[#8c6c6d] transition hover:bg-[#faf5f3] disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>

                        <button
                            type="submit"
                            disabled={pending}
                            className="inline-flex min-w-36 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#851f32] via-[#a92d3d] to-[#c34a4c] px-5 py-3 text-sm font-extrabold text-white shadow-[0_7px_18px_rgba(169,45,61,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(169,45,61,0.32)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                            {pending ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <span>บันทึกการแก้ไข</span>
                                    <span className="text-[#f6d998]">✦</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </dialog>
    );
}
