import { Suspense } from "react";
import { api } from "@/src/lib/api";

type Student = {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
};

async function StudentList() {
  let students: Student[];

  try {
    students = await api<Student[]>("/students");
  } catch (e) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        โหลดข้อมูลไม่สำเร็จ
        <p className="mt-2 text-sm">{(e as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-7 py-5">
        <div>
          <h2 className="text-lg font-bold text-[var(--heading)]">
            ข้อมูลนักเรียนทั้งหมด
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            รายชื่อนักเรียนที่ลงทะเบียนในระบบ
          </p>
        </div>

        <span className="rounded-full bg-[var(--badge-bg)] px-4 py-2 text-xs font-semibold text-[var(--badge-text)]">
          {students.length} รายการ
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[var(--surface-soft)] text-xs font-semibold tracking-wide text-[var(--muted)]">
              <th className="px-7 py-5">รหัสประจำตัว</th>
              <th className="px-7 py-5">ชื่อ - นามสกุล</th>
              <th className="px-7 py-5">สถานะ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border)] text-sm">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="py-16 text-center text-[var(--muted)]"
                >
                  ไม่พบข้อมูลนักเรียนในระบบ
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr
                  key={s.id}
                  className="transition-colors duration-200 hover:bg-[var(--surface-hover)]"
                >
                  <td className="px-7 py-5 font-semibold text-[var(--primary)]">
                    {s.studentCode}
                  </td>

                  <td className="px-7 py-5 font-medium text-[var(--foreground)]">
                    {s.firstName} {s.lastName}
                  </td>

                  <td className="px-7 py-5">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                        s.isActive
                          ? "bg-[#EAF8F0] text-[#16845B]"
                          : "bg-[#F3F0EE] text-[var(--muted)]"
                      }`}
                    >
                      {s.isActive ? "กำลังศึกษา" : "ไม่ใช้งาน"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {/* Accent Line */}
        <div className="mb-10 h-1.5 w-24 rounded-full bg-[image:var(--gradient-accent)]" />

        {/* Page Header */}
        <div className="mb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f5dca7] bg-[var(--badge-bg)] px-3 py-1.5 text-[11px] font-bold tracking-widest text-[var(--badge-text)]">
            STUDENT MANAGEMENT
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--heading)] sm:text-4xl">
            รายชื่อนักเรียน
          </h1>

          <p className="mt-3 text-sm text-[var(--muted)]">
            จัดการและตรวจสอบข้อมูลรายชื่อนักเรียนทั้งหมดในระบบ
          </p>
        </div>

        <Suspense
          fallback={
            <div className="animate-pulse rounded-[24px] border border-[var(--border)] bg-white p-12 text-center text-sm text-[var(--muted)] shadow-[var(--shadow-card)]">
              กำลังโหลดข้อมูลนักเรียน...
            </div>
          }
        >
          <StudentList />
        </Suspense>
      </div>
    </main>
  );
}