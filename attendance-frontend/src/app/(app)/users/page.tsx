
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
      <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-amber-400" />
        <div className="px-6 py-14 text-center sm:px-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
            🔒
          </div>
          <h2 className="text-lg font-extrabold text-gray-900">
            ไม่มีสิทธิ์เข้าถึง
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการผู้ใช้
          </p>
        </div>
      </div>
    );
  }

  if (!res.ok) {
    return (
      <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-amber-400" />
        <div className="px-6 py-14 text-center sm:px-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
            ⚠️
          </div>
          <h2 className="text-lg font-extrabold text-gray-900">
            โหลดข้อมูลไม่สำเร็จ
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            กรุณาตรวจสอบการเชื่อมต่อ Backend
          </p>
          <p className="mt-3 inline-flex rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
            Error {res.status}
          </p>
        </div>
      </div>
    );
  }

  const users: ManagedUser[] = await res.json();

  return <UsersManager initialUsers={users} />;
}

function UsersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-28 rounded-2xl border border-gray-100 bg-white shadow-sm"
          />
        ))}
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-7 w-48 rounded-lg bg-gray-100" />
          <div className="h-10 w-full rounded-xl bg-gray-100 sm:w-64" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-14 rounded-xl bg-gray-50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] px-4 py-7 sm:px-6 sm:py-10 lg:px-10">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8 sm:mb-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-red-600 to-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#A66A36]">
              Administration
            </span>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F1D9A8] bg-[#FFF8E9] px-3 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-[#96601D]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C58A35]" />
                TEACHER MANAGEMENT
              </div>

              <h1 className="text-2xl font-black tracking-tight text-[var(--heading)] sm:text-3xl lg:text-4xl">
                จัดการครูและผู้ใช้งาน
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                จัดการบัญชีผู้ใช้งาน เพิ่มครู แก้ไขข้อมูล
                และควบคุมสิทธิ์การเข้าใช้งานระบบ
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-[#A91D32] text-white shadow-md shadow-red-200">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="10" cy="7" r="4" />
                  <path d="M20 8v6M23 11h-6" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400">
                  USER CONTROL
                </p>
                <p className="text-sm font-extrabold text-gray-800">
                  ระบบจัดการบัญชี
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <Suspense fallback={<UsersLoading />}>
          <UsersData />
        </Suspense>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[var(--border)]/60 pt-5 text-center sm:flex-row sm:text-left">
          <p className="text-[11px] font-medium text-[var(--muted)]">
            Student Attendance Management System
          </p>
          <p className="text-[11px] font-semibold text-[var(--muted)]">
            Secure Administration Panel
          </p>
        </div>
      </div>
    </main>
  );
}
