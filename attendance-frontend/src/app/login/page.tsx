
"use client";

import { useActionState, useState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(
    loginAction,
    undefined
  );

  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-5 py-12">

      {/* Background Decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-[#f4b942]/15 blur-[100px]" />

      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-[#b42332]/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-[420px]">

        {/* Brand */}
        <div className="mb-8 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)] shadow-[0_10px_25px_rgba(180,35,50,0.20)]">

            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m2 10 10-5 10 5-10 5-10-5Z" />
              <path d="M6 12v5c3.5 2.5 8.5 2.5 12 0v-5" />
              <path d="M22 10v6" />
            </svg>

          </div>

          <p className="mt-7 text-center text-xs text-[var(--muted)]">
            Student Management System
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--heading)]">
            ยินดีต้อนรับ
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลนักเรียน
          </p>

        </div>

        {/* Login Card */}
        <form
          action={action}
          className="rounded-[28px] border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-card)] sm:p-9"
        >

          <div className="mb-7">
            <h2 className="text-xl font-bold text-[var(--heading)]">
              เข้าสู่ระบบ
            </h2>

            <p className="mt-1 text-xs text-[var(--muted)]">
              กรอกข้อมูลบัญชีผู้ใช้งานของคุณ
            </p>
          </div>

          <div className="space-y-5">

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-[var(--foreground)]"
              >
                ชื่อผู้ใช้
              </label>

              <div className="group relative">

                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--muted)] group-focus-within:text-[var(--primary)]">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                  </svg>
                </span>

                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="กรอกชื่อผู้ใช้"
                  autoComplete="username"
                  required
                  disabled={pending}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#fffcfa] py-3.5 pl-12 pr-4 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[#b5a9aa] focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[#b42332]/5 disabled:opacity-60"
                />

              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-[var(--foreground)]"
              >
                รหัสผ่าน
              </label>

              <div className="group relative">

                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--muted)] group-focus-within:text-[var(--primary)]">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="2"
                    />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete="current-password"
                  required
                  disabled={pending}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#fffcfa] py-3.5 pl-12 pr-12 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[#b5a9aa] focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[#b42332]/5 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "ซ่อนรหัสผ่าน"
                      : "แสดงรหัสผ่าน"
                  }
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-4 flex items-center text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--primary)] cursor-pointer"
                >
                  {showPassword ? "ซ่อน" : "แสดง"}
                </button>

              </div>
            </div>

            {/* Error Message */}
            {state?.error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {state.error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="
                mt-2 flex w-full items-center justify-center gap-2
                rounded-xl
                bg-[image:var(--gradient-primary)]
                px-6 py-3.5
                text-sm font-bold !text-white
                shadow-[var(--shadow-button)]
                transition-all duration-200
                hover:-translate-y-0.5
                hover:brightness-110
                active:translate-y-0
                disabled:cursor-not-allowed
                disabled:opacity-60
                disabled:hover:translate-y-0
                cursor-pointer
              "
            >
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>

          </div>

          {/* Card Footer */}
          <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
            <p className="text-xs text-[var(--muted)]">
              ระบบจัดการและเช็คชื่อนักเรียน
            </p>
          </div>

        </form>

        {/* Footer */}
        <p className="mt-7 text-center text-xs text-[var(--muted)]">
          © Student Management System
        </p>

      </div>
    </main>
  );
}
