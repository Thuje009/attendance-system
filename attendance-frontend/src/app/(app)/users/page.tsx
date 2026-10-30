
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getToken } from "@/src/lib/auth";
import UsersManager from "./UsersManager";

export type ManagedUser = {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "TEACHER";
  isActive: boolean;
  createdAt: string;
};

async function UsersData() {
  const token = await getToken();

  if (!token) redirect("/login");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const res = await fetch(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");

  if (res.status === 403) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการผู้ใช้
      </div>
    );
  }

  if (!res.ok) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        โหลดข้อมูลผู้ใช้ไม่สำเร็จ ({res.status})
        <p className="mt-2 text-sm">
          กรุณาตรวจสอบการเชื่อมต่อ Backend
        </p>
      </div>
    );
  }

  const users: ManagedUser[] = await res.json();

  return <UsersManager initialUsers={users} />;
}

export default function UsersPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 h-1.5 w-24 rounded-full bg-[image:var(--gradient-accent)]" />

        <div className="mb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f5dca7] bg-[var(--badge-bg)] px-3 py-1.5 text-[11px] font-bold tracking-widest text-[var(--badge-text)]">
            TEACHER MANAGEMENT
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--heading)] sm:text-4xl">
            จัดการครูและผู้ใช้งาน
          </h1>

          <p className="mt-3 text-sm text-[var(--muted)]">
            เพิ่มบัญชีครู แก้ไขข้อมูล และจัดการสถานะการใช้งาน
          </p>
        </div>

        <Suspense
          fallback={
            <div className="animate-pulse rounded-[24px] border border-[var(--border)] bg-white p-12 text-center text-sm text-[var(--muted)] shadow-[var(--shadow-card)]">
              กำลังโหลดข้อมูลผู้ใช้...
            </div>
          }
        >
          <UsersData />
        </Suspense>
      </div>
    </main>
  );
}
