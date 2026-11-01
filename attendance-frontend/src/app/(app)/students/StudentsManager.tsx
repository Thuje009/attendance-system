
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStudent, setStudentActive } from "./actions";
import AddStudentModal, { type CreateStudentInput } from "./AddStudentModal";

export type ClassroomOption = {
    id: string;
    grade: number;
    room: number;
    academicYear: number;
};

export type StudentRow = {
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    enrollments: {
        number: number | null;
        classroom: ClassroomOption;
    }[];
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

const cardCls =
    "rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)]";

type FilterType = "ALL" | "ACTIVE" | "INACTIVE";
type ClassFilter = string;

function UsersIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
            className="h-6 w-6" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="10" cy="7" r="4" />
            <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round"
            className="h-4 w-4" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
        </svg>
    );
}

function StatCard({
    title,
    value,
    detail,
    icon,
    color,
}: {
    title: string;
    value: number;
    detail: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className={`${cardCls} p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold text-[var(--muted)]">
                        {title}
                    </p>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--heading)]">
                        {value.toLocaleString("th-TH")}
                    </p>
                </div>

                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                    {icon}
                </div>
            </div>

            <p className="mt-3 text-xs text-[var(--muted)]">{detail}</p>
        </div>
    );
}

function StudentAvatar({ name }: { name: string }) {
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0f1] text-sm font-extrabold text-[#b42332]">
            {name.trim().charAt(0) || "น"}
        </div>
    );
}

export default function StudentsManager({
    students,
    classrooms,
}: {
    students: StudentRow[];
    classrooms: ClassroomOption[];
}) {
    const router = useRouter();

    const [classFilter, setClassFilter] = useState<ClassFilter>("ALL");
    const [showAddModal, setShowAddModal] = useState(false);

    const [msg, setMsg] = useState<{
        ok: boolean;
        text: string;
    } | null>(null);

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<FilterType>("ALL");
    const [pending, start] = useTransition();

    const activeCount = students.filter((s) => s.isActive).length;
    const inactiveCount = students.length - activeCount;
    const unassignedCount = students.filter(
        (s) => !s.enrollments[0],
    ).length;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return students.filter((s) => {
            const matchesSearch =
                !q ||
                `${s.studentCode} ${s.firstName} ${s.lastName}`
                    .toLowerCase()
                    .includes(q);

            const matchesStatus =
                filter === "ALL" ||
                (filter === "ACTIVE" && s.isActive) ||
                (filter === "INACTIVE" && !s.isActive);

            const currentClassId = s.enrollments[0]?.classroom.id;
            const matchesClass =
                classFilter === "ALL" ||
                (classFilter === "NONE" && !currentClassId) ||
                currentClassId === classFilter;

            return matchesSearch && matchesStatus && matchesClass;
        });
    }, [students, query, filter, classFilter]);

    const handleCreate = async (input: CreateStudentInput) => {
        const res = await createStudent(input);

        if (res.ok) {
            setMsg({
                ok: true,
                text: `เพิ่ม ${input.firstName} ${input.lastName} เรียบร้อยแล้ว`,
            });
            router.refresh();
        }

        return res;
    };

    const toggle = (s: StudentRow) => {
        const next = !s.isActive;
        const label = next ? "เปิดใช้งาน" : "ปิดใช้งาน";

        if (
            !window.confirm(
                `ต้องการ${label} ${s.firstName} ${s.lastName} หรือไม่?`,
            )
        ) return;

        start(async () => {
            try {
                const res = await setStudentActive(s.id, next);

                if (res.ok) {
                    setMsg({
                        ok: true,
                        text: `${label}นักเรียนเรียบร้อยแล้ว`,
                    });
                    router.refresh();
                } else {
                    setMsg({
                        ok: false,
                        text: res.error,
                    });
                }
            } catch {
                setMsg({
                    ok: false,
                    text: "ไม่สามารถเปลี่ยนสถานะได้",
                });
            }
        });
    };

    // จำนวนนักเรียนต่อชั้น (ใช้แสดงในตัวเลือก)
    const countByClass = useMemo(() => {
        const map = new Map<string, number>();
        for (const s of students) {
            const id = s.enrollments[0]?.classroom.id;
            if (id) map.set(id, (map.get(id) ?? 0) + 1);
        }
        return map;
    }, [students]);



    const hasActiveFilter =
        query.trim() !== "" || filter !== "ALL" || classFilter !== "ALL";

    const resetFilters = () => {
        setQuery("");
        setFilter("ALL");
        setClassFilter("ALL");
    };

    return (
        <div className="space-y-7 pb-10">

            {/* SUMMARY */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="นักเรียนทั้งหมด"
                    value={students.length}
                    detail="รายชื่อในระบบทั้งหมด"
                    icon={<UsersIcon />}
                    color="bg-[#fff0f1] text-[#b42332]"
                />

                <StatCard
                    title="กำลังศึกษา"
                    value={activeCount}
                    detail="บัญชีที่เปิดใช้งาน"
                    icon={<span className="text-xl">✓</span>}
                    color="bg-emerald-50 text-emerald-600"
                />

                <StatCard
                    title="ปิดใช้งาน"
                    value={inactiveCount}
                    detail="บัญชีที่ถูกปิดใช้งาน"
                    icon={<span className="text-xl">－</span>}
                    color="bg-gray-100 text-gray-500"
                />

                <StatCard
                    title="ยังไม่เข้าชั้นเรียน"
                    value={unassignedCount}
                    detail="นักเรียนที่ยังไม่มีห้อง"
                    icon={<span className="text-xl">⌂</span>}
                    color="bg-amber-50 text-amber-600"
                />
            </section>

            {/* ADD STUDENT */}
            <section className={`${cardCls} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0f1] text-2xl font-bold text-[#b42332]">
                            +
                        </div>

                        <div>
                            <h2 className="font-bold text-[var(--heading)]">
                                เพิ่มนักเรียนใหม่
                            </h2>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                                เพิ่มข้อมูลนักเรียนเข้าสู่ระบบ
                            </p>
                        </div>
                    </div>

                    <button

                        type="button"
                        onClick={() => {
                            setMsg(null);
                            setShowAddModal(true)
                        }}
                        className="
        inline-flex cursor-pointer items-center justify-center gap-2
        rounded-xl bg-[image:var(--gradient-primary)]
        px-5 py-3 text-sm font-bold !text-white
        shadow-[var(--shadow-button)] transition-all
        hover:-translate-y-0.5 hover:brightness-110
      "
                    >
                        <span className="text-lg leading-none">+</span>
                        เพิ่มนักเรียน
                    </button>
                </div>
            </section>

            <AddStudentModal
                open={showAddModal}
                classrooms={classrooms}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleCreate}
            />

            {/* MESSAGE */}
            {msg && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${msg.ok
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                        }`}
                >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-bold">
                        {msg.ok ? "✓" : "!"}
                    </span>
                    {msg.text}
                </div>
            )}

            {/* STUDENT LIST */}
            <section className={`${cardCls} overflow-hidden`}>
                <div className="space-y-4 border-b border-[var(--border)] p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-extrabold text-[var(--heading)]">
                                รายชื่อนักเรียน
                            </h2>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                                พบ {filtered.length.toLocaleString("th-TH")} จาก{" "}
                                {students.length.toLocaleString("th-TH")} คน
                            </p>
                        </div>

                        <span className="rounded-full bg-[var(--badge-bg)] px-3 py-1.5 text-xs font-bold text-[var(--badge-text)]">
                            STUDENTS
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                                <SearchIcon />
                            </span>
                            <input
                                className={`${inputCls} pl-11`}
                                placeholder="ค้นหารหัส ชื่อ หรือนามสกุล..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                aria-label="ค้นหานักเรียน"
                            />
                        </div>

                        <select
                            className={`${inputCls} lg:w-56`}
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            aria-label="กรองตามชั้นเรียน"
                        >
                            <option value="ALL">ทุกชั้นเรียน</option>
                            {classrooms.map((c) => (
                                <option key={c.id} value={c.id}>
                                    ป.{c.grade}/{c.room} · ปี {c.academicYear} (
                                    {countByClass.get(c.id) ?? 0})
                                </option>
                            ))}
                            <option value="NONE">ยังไม่เข้าชั้นเรียน ({unassignedCount})</option>
                        </select>

                        <select
                            className={`${inputCls} lg:w-44`}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterType)}
                            aria-label="กรองสถานะนักเรียน"
                        >
                            <option value="ALL">ทุกสถานะ</option>
                            <option value="ACTIVE">กำลังศึกษา</option>
                            <option value="INACTIVE">ปิดใช้งาน</option>
                        </select>

                        {hasActiveFilter && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="cursor-pointer whitespace-nowrap rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)]"
                            >
                                ล้างตัวกรอง
                            </button>
                        )}
                    </div>

                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-[var(--surface-soft)] text-[11px] font-bold tracking-wide text-[var(--muted)]">
                                <th className="px-6 py-4">นักเรียน</th>
                                <th className="px-6 py-4">รหัสประจำตัว</th>
                                <th className="px-6 py-4">ชั้นเรียน</th>
                                <th className="px-6 py-4">เลขที่</th>
                                <th className="px-6 py-4">สถานะ</th>
                                <th className="px-6 py-4 text-right">จัดการ</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[var(--border)] text-sm">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-[var(--muted)]">
                                        {students.length === 0
                                            ? "ยังไม่มีนักเรียนในระบบ"
                                            : "ไม่พบนักเรียนที่ตรงกับเงื่อนไข"}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s) => {
                                    const enrollment = s.enrollments[0];

                                    return (
                                        <tr
                                            key={s.id}
                                            className={`transition-colors hover:bg-[#fffaf8] ${!s.isActive ? "opacity-60" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <StudentAvatar name={s.firstName} />
                                                    <span className="font-semibold text-[var(--heading)]">
                                                        {s.firstName} {s.lastName}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-[var(--primary)]">
                                                {s.studentCode}
                                            </td>

                                            <td className="px-6 py-4">
                                                {enrollment ? (
                                                    <span className="rounded-lg bg-[var(--badge-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--badge-text)]">
                                                        ป.{enrollment.classroom.grade}/{enrollment.classroom.room}
                                                        {" · "}{enrollment.classroom.academicYear}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[var(--muted)]">
                                                        ยังไม่เข้าชั้น
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 font-medium text-[var(--heading)]">
                                                {enrollment?.number ?? "-"}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${s.isActive
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-gray-100 text-gray-500"
                                                        }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-gray-400"
                                                        }`} />
                                                    {s.isActive ? "กำลังศึกษา" : "ปิดใช้งาน"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    disabled={pending}
                                                    onClick={() => toggle(s)}
                                                    className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${s.isActive
                                                        ? "border-red-200 text-red-600 hover:bg-red-50"
                                                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                        }`}
                                                >
                                                    {s.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARDS */}
                <div className="space-y-3 p-4 md:hidden">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-sm text-[var(--muted)]">
                            {students.length === 0
                                ? "ยังไม่มีนักเรียนในระบบ"
                                : "ไม่พบนักเรียนที่ค้นหา"}
                        </div>
                    ) : (
                        filtered.map((s) => {
                            const enrollment = s.enrollments[0];

                            return (
                                <article
                                    key={s.id}
                                    className="rounded-xl border border-[var(--border)] bg-[#fffcfa] p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <StudentAvatar name={s.firstName} />
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm font-bold text-[var(--heading)]">
                                                    {s.firstName} {s.lastName}
                                                </h3>
                                                <p className="mt-1 text-xs font-semibold text-[var(--primary)]">
                                                    {s.studentCode}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${s.isActive
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-gray-100 text-gray-500"
                                            }`}>
                                            {s.isActive ? "กำลังศึกษา" : "ปิดใช้งาน"}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-white p-3 text-xs">
                                        <div>
                                            <p className="text-[var(--muted)]">ชั้นเรียน</p>
                                            <p className="mt-1 font-semibold text-[var(--heading)]">
                                                {enrollment
                                                    ? `ป.${enrollment.classroom.grade}/${enrollment.classroom.room}`
                                                    : "ยังไม่เข้าชั้น"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[var(--muted)]">เลขที่</p>
                                            <p className="mt-1 font-semibold text-[var(--heading)]">
                                                {enrollment?.number ?? "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={pending}
                                        onClick={() => toggle(s)}
                                        className={`mt-3 w-full cursor-pointer rounded-lg border px-3 py-2.5 text-xs font-bold transition-colors disabled:opacity-50 ${s.isActive
                                            ? "border-red-200 text-red-600 hover:bg-red-50"
                                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                            }`}
                                    >
                                        {s.isActive ? "ปิดใช้งานนักเรียน" : "เปิดใช้งานนักเรียน"}
                                    </button>
                                </article>
                            );
                        })
                    )}
                </div>

                <div className="border-t border-[var(--border)] bg-[#fffcfa] px-5 py-3 text-xs text-[var(--muted)]">
                    แสดง {filtered.length.toLocaleString("th-TH")} รายการ
                </div>
            </section>
        </div>
    );
}
